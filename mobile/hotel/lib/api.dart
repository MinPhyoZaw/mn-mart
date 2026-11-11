import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
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

class _CachedCatalogue {
  const _CachedCatalogue(this.data, this.expiresAt);
  final Json data;
  final DateTime expiresAt;
}

class HotelApi {
  HotelApi({http.Client? client, FlutterSecureStorage? secureStorage})
      : _client = client ?? http.Client(),
        _secureStorage = secureStorage ?? const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
        );
  static const sessionStorageKey = 'mn_mart_hotel_session_v1';
  static final origin = Uri.parse('https://www.mn-mart.store');
  static const storageUrl = String.fromEnvironment('SUPABASE_URL',
      defaultValue: 'https://yypxmsjyzplvtnkmnvgp.supabase.co');
  static const storageKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const receiptBucket = String.fromEnvironment('SUPABASE_RECEIPT_BUCKET',
      defaultValue: 'receipt-upload');

  final http.Client _client;
  final FlutterSecureStorage _secureStorage;
  Future<void> _storageWrites = Future.value();
  Future<void>? _restoreJob;
  int _sessionVersion = 0;
  int _profileRevision = 0;
  bool _disposed = false;
  final _catalogue = <String, _CachedCatalogue>{};
  String? _token;
  Json? user;
  bool get canUpload => storageKey.isNotEmpty;

  Future<Json> _request(String path, {Json? body, bool authenticated = false, String? method}) async {
    final requestVersion = _sessionVersion;
    final uri = origin.resolve(path);
    final request = http.Request(method ?? (body == null ? 'GET' : 'POST'), uri)
      ..followRedirects = false
      ..headers['Accept'] = 'application/json';
    final sessionToken = _token;
    if (authenticated) {
      final token = sessionToken;
      if (token == null) throw const ApiError('Sign in to continue.', 401);
      request.headers['Cookie'] = 'token=$token';
    }
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }

    final response = await _send(request);
    if (authenticated && (sessionToken != _token || requestVersion != _sessionVersion)) {
      throw const ApiError('Your session changed. Please refresh.', 409);
    }
    if (authenticated && response.statusCode == 401) await signOut();
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
      if (_disposed || requestVersion != _sessionVersion) {
        throw const ApiError('Sign-in was cancelled. Please try again.', 409);
      }
      final account = _customerAccount(decoded['user']);
      final cookie = RegExp(r'(?:^|,\s*)token=([A-Za-z0-9_.-]+)(?:;|$)')
          .firstMatch(response.headers['set-cookie'] ?? '')?.group(1);
      if (account == null || cookie == null) {
        throw const ApiError('Sign in with an MN-Mart customer account.');
      }
      _token = cookie;
      user = account;
      final version = ++_sessionVersion;
      try {
        await _storeSession(jsonEncode({'token': cookie, 'user': account}));
      } catch (_) {
        if (version == _sessionVersion) {
          try {
            await signOut();
          } catch (_) {
            // Report the original save failure below.
          }
        }
        throw const ApiError('Unable to save your login securely. Please try again.');
      }
      if (_disposed || version != _sessionVersion) {
        throw const ApiError('Sign-in was cancelled. Please try again.', 409);
      }
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

  Json? _customerAccount(dynamic account) {
    if (account is! Json || account['role'] != 'customer') return null;
    final id = account['id'] ?? account['_id'];
    if (id is! String || id.isEmpty) return null;
    return {
      'id': id, 'role': 'customer',
      'name': account['name'] is String ? account['name'] : '',
      'email': account['email'] is String ? account['email'] : '',
      if (account['profileImage'] is String) 'profileImage': account['profileImage'],
    };
  }

  DateTime? _tokenExpiry(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final payload = jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))));
      if (payload is! Json || payload['exp'] is! num) return null;
      return DateTime.fromMillisecondsSinceEpoch((payload['exp'] as num).toInt() * 1000, isUtc: true);
    } catch (_) {
      return null;
    }
  }

  Future<void> _storeSession(String? value) {
    final operation = _storageWrites.then((_) => value == null
      ? _secureStorage.delete(key: sessionStorageKey)
      : _secureStorage.write(key: sessionStorageKey, value: value));
    // Keep later writes and sign-out deletions ordered even after a failed write.
    _storageWrites = operation.catchError((Object _) {});
    return operation;
  }

  Future<void> restoreSession() => _restoreJob ??= _restoreSession();

  Future<void> _restoreSession() async {
    if (_disposed || user != null) return;
    final version = _sessionVersion;
    try {
      await _storageWrites;
      final saved = await _secureStorage.read(key: sessionStorageKey);
      if (_disposed || version != _sessionVersion || saved == null) return;
      dynamic record;
      try {
        record = jsonDecode(saved);
      } catch (_) {
        record = null;
      }
      final token = record is Json ? record['token'] : null;
      final account = record is Json ? _customerAccount(record['user']) : null;
      final expires = token is String ? _tokenExpiry(token) : null;
      if (account == null || token is! String || expires == null ||
          !expires.isAfter(DateTime.now().toUtc())) {
        await signOut();
        return;
      }
      _token = token;
      user = account;
      _sessionVersion++;
    } catch (_) {
      throw const ApiError('Your saved login could not be restored. Please sign in again.');
    }
  }

  Future<void> validateSession() async {
    if (_token == null || _disposed) return;
    final version = _sessionVersion;
    final profileRevision = _profileRevision;
    try {
      final result = await _request('/api/auth/me', authenticated: true);
      if (_disposed || version != _sessionVersion) return;
      final account = _customerAccount(result['user']);
      if (account == null) {
        await signOut();
      } else {
        if (profileRevision != _profileRevision) {
          account['profileImage'] = user?['profileImage'];
        }
        user = account;
      }
    } on ApiError {
      // Unauthorized requests clear the session in _request. Network/server errors
      // retain the saved login so an offline startup does not force another sign-in.
    }
  }

  Future<void> updateProfilePhoto(String image) async {
    final version = _sessionVersion;
    final result = await _request('/api/auth/profile',
      method: 'PATCH', authenticated: true, body: {'profileImage': image});
    final account = _customerAccount(result['user']);
    if (_disposed || version != _sessionVersion ||
        account == null || account['id'] != user?['id'] ||
        account['profileImage'] != image) {
      throw const ApiError('Could not confirm your profile photo update.');
    }
    _profileRevision++;
    user = account;
  }

  Future<void> registerCustomer({
    required String name,
    required String email,
    required String password,
  }) async {
    await _request('/api/auth/register', body: {
      'name': name,
      'email': email,
      'password': password,
    });
  }

  Future<void> signIn(String email, String password) async {
    try {
      await restoreSession();
    } on ApiError {
      // Explicit sign-in can replace a saved session that could not be read.
    }
    await _request('/api/auth/login', body: {'email': email, 'password': password});
  }

  Future<void> signOut() async {
    _sessionVersion++;
    _token = null;
    user = null;
    try {
      await _storeSession(null);
    } catch (_) {
      throw const ApiError('Could not clear the saved login. Please try signing out again.', 401);
    }
  }

  Future<Json> _publicCatalogue(String path, {bool refresh = false}) async {
    final now = DateTime.now();
    _catalogue.removeWhere((_, entry) => !entry.expiresAt.isAfter(now));
    final cached = _catalogue[path];
    if (!refresh && cached != null) {
      return jsonDecode(jsonEncode(cached.data)) as Json;
    }
    final result = await _request(path);
    _catalogue[path] = _CachedCatalogue(
      jsonDecode(jsonEncode(result)) as Json,
      DateTime.now().add(const Duration(seconds: 30)),
    );
    while (_catalogue.length > 24) {
      _catalogue.remove(_catalogue.keys.first);
    }
    return result;
  }

  Future<Json> hotels(int page, {String search = '', bool refresh = false}) {
    final query = Uri(queryParameters: {
      'category': 'hotel', 'page': '$page', 'limit': '20',
      if (search.isNotEmpty) 'q': search,
    }).query;
    return _publicCatalogue('/api/shops?$query', refresh: refresh);
  }

  Future<Json> rooms(String shop, int page, {String? checkIn, String? checkOut, bool refresh = false}) {
    final query = <String, String>{'page': '$page', 'limit': '20'};
    if (checkIn != null && checkOut != null) {
      query.addAll({'checkIn': checkIn, 'checkOut': checkOut});
    }
    final path = '/api/shops/${Uri.encodeComponent(shop)}?${Uri(queryParameters: query).query}';
    if (checkIn != null || checkOut != null) return _request(path);
    return _publicCatalogue(path, refresh: refresh);
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

  Future<Json> book(Json body) async {
    final result = await _request('/api/hotel-booking', authenticated: true, body: body);
    _catalogue.clear();
    return result;
  }

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

  void dispose() {
    _disposed = true;
    _sessionVersion++;
    _catalogue.clear();
    _client.close();
  }
}
