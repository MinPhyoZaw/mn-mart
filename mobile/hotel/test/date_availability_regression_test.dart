import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

import '../lib/api.dart';
import '../lib/hotel_details_header.dart';
import '../lib/hotel_room_widgets.dart';
import '../lib/main.dart';

class AvailabilityApi extends HotelApi {
  final pending = <Completer<Json>>[];
  final requests = <String>[];

  @override
  Future<Json> rooms(
    String shop,
    int page, {
    String? checkIn,
    String? checkOut,
    bool refresh = false,
  }) {
    if (checkIn == null) return Future.value(result());
    requests.add('$checkIn/$checkOut');
    final request = Completer<Json>();
    pending.add(request);
    return request.future;
  }

  Json result({bool empty = false, String name = 'Available room'}) => {
    'data': {
      'shop': {'isActive': true},
      'items': empty
          ? <Json>[]
          : <Json>[
              {
                '_id': name,
                'name': name,
                'type': 'room',
                'price': 30000,
                'availability': 'available',
                'isAvailable': true,
              },
            ],
      'pagination': {'hasNextPage': false},
    },
  };
}

Future<void> tick(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 400));
  await tester.pump();
}

Future<void> selectDates(WidgetTester tester, {int offset = 1}) async {
  await tester.ensureVisible(find.text('Check-in'));
  await tester.tap(find.text('Check-in'));
  await tick(tester);
  expect(find.byType(DateRangePickerDialog), findsOneWidget);
  await tester.tap(find.byIcon(Icons.edit_outlined));
  await tick(tester);
  final context = tester.element(find.byType(DateRangePickerDialog));
  final localizations = MaterialLocalizations.of(context);
  final now = DateTime.now();
  final start = DateTime(now.year, now.month, now.day + offset);
  final end = DateTime(now.year, now.month, now.day + offset + 2);
  final fields = find.byType(TextField);
  expect(fields, findsNWidgets(2));
  await tester.enterText(fields.at(0), localizations.formatCompactDate(start));
  await tester.enterText(fields.at(1), localizations.formatCompactDate(end));
  await tester.tap(find.text(localizations.okButtonLabel));
  await tick(tester);
  expect(find.byType(DateRangePickerDialog), findsNothing);
}

void expectHotelAndDates(WidgetTester tester) {
  expect(find.text('Regression Hotel'), findsWidgets);
  expect(find.text('Test Street, Myitkyina'), findsOneWidget);
  expect(find.text('Call now'), findsOneWidget);
  expect(find.text('Check-in'), findsOneWidget);
  expect(find.text('Check-out'), findsOneWidget);
  expect(find.text('2 nights'), findsOneWidget);
  expect(find.text('Rooms'), findsOneWidget);
  final pinned = tester.renderObject<RenderSliver>(
    find.byType(PinnedHeaderSliver),
  );
  final geometry = pinned.geometry;
  expect(geometry, isNotNull);
  if (geometry != null) {
    expect(geometry.layoutExtent, lessThanOrEqualTo(geometry.paintExtent));
  }
  expect(tester.takeException(), isNull);
}

Future<AvailabilityApi> openHotel(WidgetTester tester) async {
  tester.view.physicalSize = const Size(360, 640);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  final api = AvailabilityApi();
  addTearDown(api.dispose);
  await tester.pumpWidget(
    MaterialApp(
      theme: ThemeData(useMaterial3: true),
      home: Rooms(
        api: api,
        hotel: const {
          '_id': 'hotel-test',
          'name': 'Regression Hotel',
          'address': 'Test Street, Myitkyina',
          'phone': '09123456789',
        },
        signIn: () async => true,
      ),
    ),
  );
  await tester.pumpAndSettle();
  return api;
}

void main() {
  testWidgets(
    'pinned dates measure the child before and after selection at large text sizes',
    (tester) async {
      final now = DateTime.now();
      final selected = DateTimeRange(
        start: now,
        end: now.add(const Duration(days: 2)),
      );
      for (final stay in <DateTimeRange?>[null, selected]) {
        await tester.pumpWidget(
          MaterialApp(
            home: MediaQuery(
              data: const MediaQueryData(
                size: Size(320, 640),
                textScaler: TextScaler.linear(2),
              ),
              child: Scaffold(
                body: CustomScrollView(
                  slivers: [
                    PinnedHeaderSliver(
                      child: StayDatePanel(dates: stay, onTap: () {}),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 1000)),
                  ],
                ),
              ),
            ),
          ),
        );
        await tester.pump();
        final header = tester.renderObject<RenderSliver>(
          find.byType(PinnedHeaderSliver),
        );
        expect(
          header.geometry?.scrollExtent,
          tester.getSize(find.byType(StayDatePanel)).height,
        );
        expect(tester.takeException(), isNull);
        await tester.drag(find.byType(CustomScrollView), const Offset(0, -200));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        await tester.drag(find.byType(CustomScrollView), const Offset(0, 400));
        await tester.pumpAndSettle();
      }
    },
  );

  for (final outcome in ['success', 'empty', 'failure']) {
    testWidgets(
      'real date flow keeps hotel visible during loading and $outcome',
      (tester) async {
        final api = await openHotel(tester);
        await selectDates(tester);
        expectHotelAndDates(tester);
        expect(find.byType(CircularProgressIndicator), findsOneWidget);
        if (outcome == 'failure') {
          api.pending.last.completeError(const ApiError('Availability failed'));
        } else {
          api.pending.last.complete(api.result(empty: outcome == 'empty'));
        }
        await tester.pumpAndSettle();
        expectHotelAndDates(tester);
        if (outcome == 'empty') {
          expect(
            find.text('No rooms are listed for this hotel.'),
            findsOneWidget,
          );
        } else if (outcome == 'failure') {
          expect(find.text('Availability failed'), findsOneWidget);
          await tester.ensureVisible(find.text('Retry'));
          await tester.tap(find.text('Retry'));
          await tick(tester);
          api.pending.last.complete(api.result());
          await tester.pumpAndSettle();
        }
        final scroll = find.descendant(
          of: find.byType(PagedList),
          matching: find.byType(CustomScrollView),
        );
        await tester.drag(scroll, const Offset(0, -350));
        await tester.pumpAndSettle();
        await tester.drag(scroll, const Offset(0, 900));
        await tester.pumpAndSettle();
        expectHotelAndDates(tester);
        expect(
          tester.getBottomLeft(find.byType(HotelDetailsHeader)).dy,
          lessThanOrEqualTo(tester.getTopLeft(find.byType(StayDatePanel)).dy),
        );
        expect(
          tester.getBottomLeft(find.byType(StayDatePanel)).dy,
          lessThanOrEqualTo(tester.getTopLeft(find.text('Rooms')).dy),
        );
      },
    );
  }

  testWidgets(
    'cancellation preserves dates and a late result cannot replace newer availability',
    (tester) async {
      final api = await openHotel(tester);
      await selectDates(tester);
      final older = api.pending.last;
      await selectDates(tester, offset: 4);
      final newer = api.pending.last;
      newer.complete(api.result(name: 'Newer room'));
      await tester.pumpAndSettle();
      older.complete(api.result(name: 'Stale room'));
      await tester.pumpAndSettle();
      expect(find.text('Newer room'), findsOneWidget);
      expect(find.text('Stale room'), findsNothing);
      final requests = api.requests.length;
      await tester.tap(find.text('Check-in'));
      await tick(tester);
      final picker = tester.element(find.byType(DateRangePickerDialog));
      Navigator.of(picker).pop();
      await tester.pumpAndSettle();
      expect(api.requests.length, requests);
      expectHotelAndDates(tester);
      expect(find.text('Newer room'), findsOneWidget);
    },
  );
}
