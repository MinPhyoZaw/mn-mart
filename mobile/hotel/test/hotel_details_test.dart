import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../lib/api.dart';
import '../lib/main.dart';
import '../lib/hotel_details_header.dart';
import '../lib/hotel_room_widgets.dart';

void main() {
  testWidgets('scroll collapses the photo and keeps dates accessible', (tester) async {
    tester.view.physicalSize = const Size(360, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final api = HotelApi();
    addTearDown(api.dispose);
    await tester.pumpWidget(MaterialApp(home: Rooms(
      api: api, hotel: sampleHotels.first, signIn: () async => true)));
    await tester.pumpAndSettle();
    final appBar = find.byType(FlexibleSpaceBar);
    final initialHeight = tester.getSize(appBar).height;
    await tester.drag(find.byType(ListView), const Offset(0, -450));
    await tester.pumpAndSettle();
    expect(tester.getSize(appBar).height, lessThan(initialHeight));
    expect(find.text('Check-in').hitTestable(), findsOneWidget);
    expect(find.text('Check-out').hitTestable(), findsOneWidget);
    expect(find.text('Manaw Riverside Hotel').hitTestable(), findsOneWidget);
    await tester.tap(find.text('Check-in'));
    await tester.pumpAndSettle();
    expect(find.byType(DateRangePickerDialog), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('room date action is enabled before availability is checked', (tester) async {
    var selected = false;
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: SingleChildScrollView(
      child: HotelRoomCard(room: const {'name': 'Single', 'price': 30000},
        price: '30,000 MMK', action: 'Select dates', status: '',
        onTap: () => selected = true),
    ))));
    await tester.tap(find.text('Select dates'));
    expect(selected, isTrue);
    expect(find.textContaining('Available for'), findsNothing);
  });

  testWidgets('long information wraps at large text sizes and missing phones are hidden', (tester) async {
    await tester.pumpWidget(MaterialApp(home: MediaQuery(
      data: const MediaQueryData(size: Size(320, 640), textScaler: TextScaler.linear(2)),
      child: const Scaffold(body: SingleChildScrollView(child: HotelDetailsHeader(hotel: {
        'name': 'Hotel with a longer name',
        'address': 'A long hotel address on a street in Myitkyina, Kachin State',
      }))),
    )));
    expect(find.text('Call now'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}
