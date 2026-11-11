import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import '../lib/api.dart';

const account = <String, dynamic>{
  'id': 'customer-a', 'name': 'Test Customer', 'email': 'customer@example.test', 'role': 'customer',
};

String tokenWithExpiry(Duration remaining) {
  final expires = DateTime.now().toUtc().add(remaining).millisecondsSinceEpoch ~/ 1000;
  final payload = base64Url.encode(utf8.encode(jsonEncode({'sub': 'customer-a', 'exp': expires})))
      .replaceAll('=', '');
  return 'header.$payload.signature';
}

http.Response loginResponse(String token) => http.Response(
  jsonEncode({'success': true, 'user': account}), 200,
  headers: {'set-cookie': 'token=$token; Path=/; Max-Age=604800; HttpOnly'},
);

String savedSession(String token) => jsonEncode({'token': token, 'user': account});

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));
  const storage = FlutterSecureStorage();

  test('login survives a new API instance without a network request or stored password', () async {
    final token = tokenWithExpiry(const Duration(days: 7));
    final first = HotelApi(client: MockClient((request) async => loginResponse(token)));
    await first.signIn('customer@example.test', 'test-password');
    final record = await storage.read(key: HotelApi.sessionStorageKey);
    expect(record, isNotNull);
    expect(record, isNot(contains('test-password')));
    first.dispose();

    var requests = 0;
    final reopened = HotelApi(client: MockClient((request) async {
      requests++;
      return http.Response('{}', 503);
    }));
    addTearDown(reopened.dispose);
    await reopened.restoreSession();
    expect(reopened.user?['id'], 'customer-a');
    expect(requests, 0);
    await reopened.validateSession();
    expect(requests, 1);
    expect(reopened.user?['id'], 'customer-a');
  });

  test('restored session sends its cookie and normalizes the server user ID', () async {
    final token = tokenWithExpiry(const Duration(days: 1));
    FlutterSecureStorage.setMockInitialValues({HotelApi.sessionStorageKey: savedSession(token)});
    final api = HotelApi(client: MockClient((request) async {
      expect(request.headers['cookie'], 'token=$token');
      return http.Response(jsonEncode({'user': {
        '_id': 'customer-a', 'role': 'customer', 'name': 'Updated Name', 'email': 'customer@example.test',
      }}), 200);
    }));
    addTearDown(api.dispose);
    await api.restoreSession();
    await api.validateSession();
    expect(api.user?['id'], 'customer-a');
    expect(api.user?['name'], 'Updated Name');
  });

  test('sign-out removes saved credentials so reopening stays signed out', () async {
    final token = tokenWithExpiry(const Duration(days: 1));
    FlutterSecureStorage.setMockInitialValues({HotelApi.sessionStorageKey: savedSession(token)});
    final first = HotelApi();
    await first.restoreSession();
    await first.signOut();
    expect(first.user, isNull);
    expect(await storage.read(key: HotelApi.sessionStorageKey), isNull);
    first.dispose();
    final reopened = HotelApi();
    addTearDown(reopened.dispose);
    await reopened.restoreSession();
    expect(reopened.user, isNull);
  });

  test('expired and malformed credentials are cleared locally', () async {
    for (final record in [savedSession(tokenWithExpiry(const Duration(days: -1))), '{broken']) {
      FlutterSecureStorage.setMockInitialValues({HotelApi.sessionStorageKey: record});
      final api = HotelApi(client: MockClient((request) async {
        fail('Expired credentials should not make an authenticated request.');
      }));
      await api.restoreSession();
      expect(api.user, isNull);
      expect(await storage.read(key: HotelApi.sessionStorageKey), isNull);
      api.dispose();
    }
  });

  test('an unauthorized server response clears both memory and secure storage', () async {
    final token = tokenWithExpiry(const Duration(days: 1));
    FlutterSecureStorage.setMockInitialValues({HotelApi.sessionStorageKey: savedSession(token)});
    final api = HotelApi(client: MockClient((request) async => http.Response('{"user":null}', 401)));
    addTearDown(api.dispose);
    await api.restoreSession();
    await api.validateSession();
    expect(api.user, isNull);
    expect(await storage.read(key: HotelApi.sessionStorageKey), isNull);
  });

  test('temporary connection failure retains the remembered login', () async {
    final token = tokenWithExpiry(const Duration(days: 1));
    final record = savedSession(token);
    FlutterSecureStorage.setMockInitialValues({HotelApi.sessionStorageKey: record});
    final api = HotelApi(client: MockClient((request) async => throw http.ClientException('Offline')));
    addTearDown(api.dispose);
    await api.restoreSession();
    await api.validateSession();
    expect(api.user?['id'], 'customer-a');
    expect(await storage.read(key: HotelApi.sessionStorageKey), record);
  });

  test('a changed account role clears the restored session', () async {
    final token = tokenWithExpiry(const Duration(days: 1));
    FlutterSecureStorage.setMockInitialValues({HotelApi.sessionStorageKey: savedSession(token)});
    final api = HotelApi(client: MockClient((request) async => http.Response(
      jsonEncode({'user': {'_id': 'customer-a', 'role': 'vendor'}}), 200)));
    addTearDown(api.dispose);
    await api.restoreSession();
    await api.validateSession();
    expect(api.user, isNull);
    expect(await storage.read(key: HotelApi.sessionStorageKey), isNull);
  });

  test('sign-out during restoration cannot restore the old session afterward', () async {
    final token = tokenWithExpiry(const Duration(days: 1));
    FlutterSecureStorage.setMockInitialValues({HotelApi.sessionStorageKey: savedSession(token)});
    final api = HotelApi();
    addTearDown(api.dispose);
    final restoration = api.restoreSession();
    await api.signOut();
    await restoration;
    expect(api.user, isNull);
    expect(await storage.read(key: HotelApi.sessionStorageKey), isNull);
  });

  test('a cancelled login cannot save credentials after sign-out', () async {
    final pending = Completer<http.Response>();
    final started = Completer<void>();
    final api = HotelApi(client: MockClient((request) async {
      started.complete();
      return await pending.future;
    }));
    addTearDown(api.dispose);
    final login = api.signIn('customer@example.test', 'test-password');
    final result = expectLater(login, throwsA(isA<ApiError>().having((e) => e.status, 'status', 409)));
    await started.future;
    await api.signOut();
    pending.complete(loginResponse(tokenWithExpiry(const Duration(days: 1))));
    await result;
    expect(api.user, isNull);
    expect(await storage.read(key: HotelApi.sessionStorageKey), isNull);
  });

  test('profile photo saves through shared auth and survives a stale session read', () async {
    final token = tokenWithExpiry(const Duration(days: 1));
    const photo = 'data:image/jpeg;base64,/9j/';
    final pendingProfile = Completer<http.Response>();
    final readingProfile = Completer<void>();
    final api = HotelApi(client: MockClient((request) async {
      if (request.url.path == '/api/auth/login') return loginResponse(token);
      expect(request.headers['cookie'], 'token=$token');
      if (request.url.path == '/api/auth/me') {
        readingProfile.complete();
        return pendingProfile.future;
      }
      expect(request.url.path, '/api/auth/profile');
      expect(request.method, 'PATCH');
      expect(jsonDecode(request.body), {'profileImage': photo});
      return http.Response(jsonEncode({
        'user': {...account, 'profileImage': photo},
      }), 200);
    }));
    addTearDown(api.dispose);
    await api.signIn('customer@example.test', 'test-password');
    final validation = api.validateSession();
    await readingProfile.future;
    await api.updateProfilePhoto(photo);
    pendingProfile.complete(http.Response(jsonEncode({'user': account}), 200));
    await validation;
    expect(api.user?['profileImage'], photo);
  });

}
