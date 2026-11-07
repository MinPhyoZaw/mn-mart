import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../lib/api.dart';
import '../lib/main.dart';

class FakeHotelApi extends HotelApi {
  int hotelCalls = 0;
  int orderCalls = 0;

  FakeHotelApi() {
    user = {'id': 'customer-a', 'email': 'customer@example.test'};
  }

  @override
  Future<Json> hotels(int page, {String search = '', bool refresh = false}) async {
    hotelCalls++;
    return {
      'data': [{'_id': 'hotel-a', 'name': 'Test Hotel', 'category': 'hotel'}],
      'meta': {'total': 1, 'totalPages': 1},
    };
  }

  @override
  Future<Json> orders(int page) async {
    orderCalls++;
    return {
      'data': [{'_id': 'order-a', 'hotelReference': 'MH-0001', 'serviceType': 'hotel',
        'shopName': 'Test Hotel', 'hotelRoomType': 'Single', 'totalAmount': 40000,
        'orderStatus': 'pending', 'paymentStatus': 'pending', 'vendorStatus': 'new'}],
      'pagination': {'hasNextPage': false},
    };
  }
}

void main() {
  testWidgets('visited tabs keep their data and sign-out removes customer receipts', (tester) async {
    final api = FakeHotelApi();
    addTearDown(api.dispose);
    await tester.pumpWidget(MaterialApp(home: Home(api: api)));
    await tester.pumpAndSettle();
    expect(api.hotelCalls, 1);
    expect(api.orderCalls, 0);

    await tester.tap(find.text('Bookings'));
    await tester.pumpAndSettle();
    expect(api.orderCalls, 1);
    expect(find.text('MH - 0001'), findsOneWidget);
    await tester.tap(find.text('Explore'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Bookings'));
    await tester.pumpAndSettle();
    expect(api.hotelCalls, 1);
    expect(api.orderCalls, 1);

    await tester.tap(find.text('Account'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign out'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Bookings'));
    await tester.pumpAndSettle();
    expect(find.text('MH - 0001'), findsNothing);
    expect(find.text('Sign in to view bookings'), findsOneWidget);
  });

  testWidgets('refresh keeps the current rows visible and updates after completion', (tester) async {
    final pending = Completer<PageResult>();
    var calls = 0;
    Widget page(int token) => MaterialApp(home: Scaffold(body: PagedList(
      key: const ValueKey('preserved-list'),
      refreshToken: token,
      intro: const Text('Rooms'), empty: 'No rooms',
      load: (_, refresh) async {
        calls++;
        if (calls == 1) {
          return (rows: <Json>[{'name': 'Existing room'}], more: false);
        }
        return await pending.future;
      },
      item: (row) => Text(row['name'] as String),
    )));
    await tester.pumpWidget(page(0));
    await tester.pumpAndSettle();
    await tester.pumpWidget(page(1));
    await tester.pump();
    expect(find.text('Existing room'), findsOneWidget);
    expect(find.byType(LinearProgressIndicator), findsOneWidget);
    pending.complete((rows: <Json>[{'name': 'Updated room'}], more: false));
    await tester.pumpAndSettle();
    expect(find.text('Updated room'), findsOneWidget);
    expect(calls, 2);
  });

  testWidgets('refresh reloads all previously loaded pages', (tester) async {
    final calls = <String>[];
    Widget page(int token) => MaterialApp(home: Scaffold(body: PagedList(
      key: const ValueKey('paged-list'), refreshToken: token,
      intro: const Text('Hotels'), empty: 'None',
      load: (page, refresh) async {
        calls.add('$page:$refresh');
        return (rows: <Json>[{'name': 'Hotel $page'}], more: page < 3);
      },
      item: (row) => Text(row['name'] as String),
    )));
    await tester.pumpWidget(page(0));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Load more'));
    await tester.pumpAndSettle();
    await tester.pumpWidget(page(1));
    await tester.pumpAndSettle();
    expect(find.text('Hotel 1'), findsOneWidget);
    expect(find.text('Hotel 2'), findsOneWidget);
    expect(calls, ['1:false', '2:false', '1:true', '2:true']);
  });

  testWidgets('pagination does not duplicate a booking when page boundaries move', (tester) async {
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: PagedList(
      intro: const Text('Bookings'), empty: 'None',
      load: (page, refresh) async => (
        rows: <Json>[
          {'_id': 'booking-a', 'name': 'Booking A'},
          if (page == 2) {'_id': 'booking-b', 'name': 'Booking B'},
        ], more: page < 2,
      ),
      item: (row) => Text(row['name'] as String, key: ValueKey(row['_id'])),
    ))));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Load more'));
    await tester.pumpAndSettle();
    expect(find.text('Booking A'), findsOneWidget);
    expect(find.text('Booking B'), findsOneWidget);
  });

}
