import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import '../lib/api.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));
  test('catalogue cache reuses responses, isolates mutations and supports forced refresh', () async {
    var calls = 0;
    final api = HotelApi(client: MockClient((request) async {
      calls++;
      return http.Response(jsonEncode({'success': true, 'data': [{'name': 'Hotel $calls'}]}), 200);
    }));
    addTearDown(api.dispose);
    final first = await api.hotels(1);
    (first['data'] as List).clear();
    final second = await api.hotels(1);
    expect(calls, 1);
    expect((second['data'] as List).single['name'], 'Hotel 1');
    await api.hotels(1, refresh: true);
    expect(calls, 2);
    await api.hotels(1, search: 'another area');
    expect(calls, 3);
  });

  test('dated room availability always comes from the backend', () async {
    var calls = 0;
    final api = HotelApi(client: MockClient((request) async {
      calls++;
      return http.Response(jsonEncode({'success': true, 'data': {}}), 200);
    }));
    addTearDown(api.dispose);
    await api.rooms('hotel-a', 1);
    await api.rooms('hotel-a', 1);
    expect(calls, 1);
    await api.rooms('hotel-a', 1, checkIn: '2030-01-01', checkOut: '2030-01-03');
    await api.rooms('hotel-a', 1, checkIn: '2030-01-01', checkOut: '2030-01-03');
    expect(calls, 3);
  });

  test('a response from a signed-out session cannot restore private data', () async {
    final pending = Completer<http.Response>();
    final api = HotelApi(client: MockClient((request) async {
      if (request.url.path == '/api/auth/login') {
        return http.Response(jsonEncode({'success': true,
          'user': {'id': 'customer-a', 'role': 'customer'}}), 200,
          headers: {'set-cookie': 'token=header.payload.signature; Path=/'});
      }
      return await pending.future;
    }));
    addTearDown(api.dispose);
    await api.signIn('customer@example.test', 'test-password');
    final request = api.orders(1);
    final result = expectLater(request, throwsA(isA<ApiError>().having(
      (error) => error.status, 'status', 409)));
    await api.signOut();
    pending.complete(http.Response(jsonEncode({'success': true, 'data': []}), 200));
    await result;
    expect(api.user, isNull);
  });

}
