import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:manaw_mart_hotel/splash_screen.dart';

void main() {
  String visibleTitle(WidgetTester tester) => tester
      .widget<Text>(find.byKey(const ValueKey('splash-typed-title')))
      .data!;

  testWidgets('types the full title before opening home once', (tester) async {
    var completed = 0;
    await tester.pumpWidget(MaterialApp(
      home: HotelSplashScreen(onFinished: () => completed++),
    ));
    await tester.pump();
    expect(visibleTitle(tester), isEmpty);
    await tester.pump(const Duration(milliseconds: 1610));
    expect(visibleTitle(tester), isNotEmpty);
    expect(visibleTitle(tester), isNot(HotelSplashScreen.title));
    expect(completed, 0);
    await tester.pump(const Duration(milliseconds: 1610));
    expect(visibleTitle(tester), HotelSplashScreen.title);
    expect(completed, 0);
    await tester.pump(HotelSplashScreen.titleHoldDuration);
    expect(completed, 1);
    await tester.pump(const Duration(seconds: 2));
    expect(completed, 1);
    expect(tester.takeException(), isNull);
  });

  testWidgets('disposing the splash cancels pending navigation', (tester) async {
    var completed = 0;
    await tester.pumpWidget(MaterialApp(
      home: HotelSplashScreen(onFinished: () => completed++),
    ));
    await tester.pump();
    await tester.pump(HotelSplashScreen.typingDuration);
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 3));
    expect(completed, 0);
    expect(tester.takeException(), isNull);
  });

  testWidgets('system animation settings do not skip typing or shorten the splash', (tester) async {
    var completed = 0;
    await tester.pumpWidget(MaterialApp(
      home: MediaQuery(
        data: const MediaQueryData(disableAnimations: true),
        child: HotelSplashScreen(onFinished: () => completed++),
      ),
    ));
    expect(visibleTitle(tester), isEmpty);
    await tester.pump(HotelSplashScreen.typingDuration);
    expect(visibleTitle(tester), HotelSplashScreen.title);
    expect(completed, 0);
    await tester.pump(HotelSplashScreen.titleHoldDuration);
    expect(completed, 1);
  });
}
