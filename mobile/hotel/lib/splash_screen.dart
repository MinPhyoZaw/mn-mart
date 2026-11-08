import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Local assets keep the welcome screen available without a connection.
class HotelSplashScreen extends StatefulWidget {
  const HotelSplashScreen({super.key, required this.onFinished});

  final VoidCallback onFinished;
  static const title = 'Manaw Mart Hotel Booking';
  static const background = Color(0xffD62828);
  static const typingDuration = Duration(milliseconds: 3220);
  static const titleHoldDuration = Duration(milliseconds: 1400);

  @override
  State<HotelSplashScreen> createState() => _HotelSplashScreenState();
}

class _HotelSplashScreenState extends State<HotelSplashScreen> {
  Timer? _typingTimer;
  int _visibleCharacters = 0;
  Timer? _finishTimer;

  @override
  void initState() {
    super.initState();
    // Reveal letters on a real clock. Android's animation-duration setting
    // must not fast-forward the title and immediately leave this screen.
    _typingTimer = Timer.periodic(const Duration(milliseconds: 140), (timer) {
      if (!mounted) return;
      setState(() => _visibleCharacters++);
      if (_visibleCharacters == HotelSplashScreen.title.length) {
        timer.cancel();
        _finishTimer = Timer(HotelSplashScreen.titleHoldDuration, () {
          if (mounted) widget.onFinished();
        });
      }
    });
  }

  @override
  void dispose() {
    _finishTimer?.cancel();
    _typingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logoSize = math.min(MediaQuery.sizeOf(context).width * .30, 116.0);
    const titleStyle = TextStyle(
      color: Colors.white,
      fontSize: 28,
      fontWeight: FontWeight.w700,
      letterSpacing: .4,
      height: 1.3,
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: HotelSplashScreen.background,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: HotelSplashScreen.background,
        body: Stack(
          fit: StackFit.expand,
          children: [
            const IgnorePointer(
              child: CustomPaint(painter: _WovenTexturePainter()),
            ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(logoSize * .25),
                        child: Image.asset(
                          'assets/images/mn-mart-logo.png',
                          width: logoSize,
                          height: logoSize,
                          semanticLabel: 'MN-Mart logo',
                        ),
                      ),
                      const SizedBox(height: 28),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 340),
                        child: Semantics(
                          label: HotelSplashScreen.title,
                          header: true,
                          child: ExcludeSemantics(
                            child: Stack(
                              alignment: Alignment.topCenter,
                              children: [
                                // Reserve the final title's space while typing.
                                const Opacity(
                                  opacity: 0,
                                  child: Text(HotelSplashScreen.title,
                                      style: titleStyle,
                                      textAlign: TextAlign.center),
                                ),
                                Text(
                                  HotelSplashScreen.title.substring(
                                    0, _visibleCharacters),
                                  key: const ValueKey('splash-typed-title'),
                                  style: titleStyle,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Quiet woven diamonds over a solid red base, with no image download.
class _WovenTexturePainter extends CustomPainter {
  const _WovenTexturePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final thread = Paint()
      ..color = const Color(0x30FFFFFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    for (double y = -32; y < size.height + 32; y += 64) {
      for (double x = -32; x < size.width + 32; x += 64) {
        final diamond = Path()
          ..moveTo(x, y - 20)
          ..lineTo(x + 20, y)
          ..lineTo(x, y + 20)
          ..lineTo(x - 20, y)
          ..close();
        canvas.drawPath(diamond, thread);
        canvas.drawLine(Offset(x - 3, y), Offset(x + 3, y), thread);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _WovenTexturePainter oldDelegate) => false;
}
