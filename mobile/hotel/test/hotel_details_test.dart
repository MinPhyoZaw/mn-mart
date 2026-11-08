import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../lib/api.dart';
import '../lib/main.dart';

void main() {
  testWidgets('hotel details remain fixed while rooms scroll', (tester) async {
    final api = HotelApi();
    addTearDown(api.dispose);
    final hotel = <String, dynamic>{
      ...sampleHotels.first,
      'address': 'Test Street, Myitkyina',
      'phone': '09123456789',
    };
    await tester.pumpWidget(MaterialApp(
      home: Rooms(api: api, hotel: hotel, signIn: () async => true),
    ));
    await tester.pumpAndSettle();
    final photo = find.byKey(const ValueKey('hotel-details-photo'));
    final address = find.text('Test Street, Myitkyina');
    final room = find.text('Room 101 · River View Double');
    final photoPosition = tester.getTopLeft(photo);
    final addressPosition = tester.getTopLeft(address);
    final roomPosition = tester.getTopLeft(room);
    expect(tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Call now'))
        .onPressed, isNotNull);
    await tester.drag(find.byType(ListView), const Offset(0, -200));
    await tester.pumpAndSettle();
    expect(tester.getTopLeft(photo), photoPosition);
    expect(tester.getTopLeft(address), addressPosition);
    expect(tester.getTopLeft(room).dy, lessThan(roomPosition.dy));
    expect(tester.takeException(), isNull);
  });
}
