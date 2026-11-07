import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

typedef Json = Map<String, dynamic>;

class ApiError implements Exception {
  const ApiError(this.message, [this.status]);
  final String message;
  final int? status;
  @override
  String toString() => message;
}

String bookingKey() {
  final random = Random.secure();
  return List.generate(24, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
}

class HotelApi {
  static final origin = Uri.parse('https://www.mn-mart.store');
  static const storageUrl = String.fromEnvironment('SUPABASE_URL',
      defaultValue: 'https://yypxmsjyzplvtnkmnvgp.supabase.co');
  static const storageKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const receiptBucket = String.fromEnvironment('SUPABASE_RECEIPT_BUCKET',
      defaultValue: 'receipt-upload');

  final _client = http.Client();
  String? _token;
  Json? user;
  bool get canUpload => storageKey.isNotEmpty;

  Future<Json> _request(String path, {Json? body, bool authenticated = false}) async {
    final uri = origin.resolve(path);
    final request = http.Request(body == null ? 'GET' : 'POST', uri)
      ..followRedirects = false
      ..headers['Accept'] = 'application/json';
    if (authenticated) {
      final token = _token;
      if (token == null) throw const ApiError('Sign in to continue.', 401);
      request.headers['Cookie'] = 'token=$token';
    }
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }

    final response = await _send(request);
    if (authenticated && response.statusCode == 401) signOut();
    final dynamic decoded;
    try {
      decoded = jsonDecode(response.body);
    } on FormatException {
      throw ApiError('MN-Mart returned an unexpected response.', response.statusCode);
    }
    if (decoded is! Json) throw const ApiError('Invalid response from MN-Mart.');
    if (response.statusCode < 200 || response.statusCode >= 300 || decoded['success'] == false) {
      final error = decoded['error'];
      throw ApiError(
        (decoded['message'] ?? (error is Json ? error['message'] : null) ??
          'The request failed. Please try again.').toString(),
        response.statusCode,
      );
    }
    if (path == '/api/auth/login') {
      final account = decoded['user'];
      final cookie = RegExp(r'(?:^|,\s*)token=([A-Za-z0-9_.-]+)(?:;|$)')
          .firstMatch(response.headers['set-cookie'] ?? '')?.group(1);
      if (account is! Json || account['role'] != 'customer' || cookie == null) {
        throw const ApiError('Sign in with an MN-Mart customer account.');
      }
      _token = cookie;
      user = account;
    }
    return decoded;
  }

  Future<http.Response> _send(http.Request request) async {
    try {
      return await (() async => http.Response.fromStream(await _client.send(request)))()
          .timeout(const Duration(seconds: 30));
    } on TimeoutException {
      throw const ApiError('The connection timed out. Please try again.');
    } on http.ClientException {
      throw const ApiError('Could not connect. Check your internet connection.');
    }
  }

  Future<void> signIn(String email, String password) async {
    await _request('/api/auth/login', body: {'email': email, 'password': password});
  }

  void signOut() {
    _token = null;
    user = null;
  }

  Future<Json> hotels(int page) => _request('/api/shops?category=hotel&page=$page&limit=20');

  Future<Json> rooms(String shop, int page, {String? checkIn, String? checkOut}) {
    final query = <String, String>{'page': '$page', 'limit': '20'};
    if (checkIn != null && checkOut != null) {
      query.addAll({'checkIn': checkIn, 'checkOut': checkOut});
    }
    return _request('/api/shops/${Uri.encodeComponent(shop)}?${Uri(queryParameters: query).query}');
  }

  Future<Json> orders(int page) async {
    final result = await _request('/api/orders?page=$page&limit=20', authenticated: true);
    final rows = (result['data'] as List).cast<Json>();
    final missing = rows.where((order) => order['serviceType'] == 'hotel' &&
        (order['hotelReference'] == null || order['hotelReference'] == '')).toList();
    if (missing.isNotEmpty) {
      final references = await _request('/api/hotel-bookings/references',
        authenticated: true, body: {'orderIds': missing.map((order) => order['_id']).toList()});
      final byId = {for (final reference in (references['data'] as List).cast<Json>())
        reference['_id']: reference['hotelReference']};
      for (final order in missing) {
        order['hotelReference'] = byId[order['_id']];
      }
    }
    return result;
  }

  Future<Json> book(Json body) =>
      _request('/api/hotel-booking', authenticated: true, body: body);

  Future<String> uploadReceipt(String shop, XFile file) async {
    if (!canUpload) throw const ApiError('Receipt upload is unavailable in this build.');
    final extension = file.name.split('.').last.toLowerCase();
    final type = const {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
      'png': 'image/png', 'webp': 'image/webp'}[extension];
    if (type == null) throw const ApiError('Choose a JPG, PNG or WebP image.');
    if (await file.length() > 5 * 1024 * 1024) {
      throw const ApiError('Choose a receipt under 5 MB.');
    }
    final storage = Uri.parse(storageUrl);
    if (storage.scheme != 'https' || storage.host.isEmpty) {
      throw const ApiError('Receipt storage must use HTTPS.');
    }
    final path = '$receiptBucket/receipts/hotel/$shop/${bookingKey()}.$extension';
    final request = http.Request('POST', storage.resolve('/storage/v1/object/$path'))
      ..followRedirects = false
      ..headers['apikey'] = storageKey
      ..headers['Content-Type'] = type
      ..bodyBytes = await file.readAsBytes();
    // Legacy anon JWTs require the Authorization header. Publishable keys use apikey.
    if (!storageKey.startsWith('sb_publishable_')) {
      final parts = storageKey.split('.');
      dynamic claims;
      if (parts.length == 3) {
        try {
          claims = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
        } on FormatException {
          throw const ApiError('The configured Supabase key is invalid.');
        }
      }
      if (claims is! Json || claims['role'] != 'anon') {
        throw const ApiError('Configure a public Supabase anon or publishable key.');
      }
      request.headers['Authorization'] = 'Bearer $storageKey';
    }
    final response = await _send(request);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const ApiError('Receipt upload failed. Check storage setup or try again.');
    }
    return storage.resolve('/storage/v1/object/public/$path').toString();
  }

  void dispose() => _client.close();
}
