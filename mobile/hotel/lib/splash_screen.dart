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
  static const typingDuration = Duration(milliseconds: 1840);
  static const titleHoldDuration = Duration(milliseconds: 500);

  @override
  State<HotelSplashScreen> createState() => _HotelSplashScreenState();
}

class _HotelSplashScreenState extends State<HotelSplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _typing;
  Timer? _finishTimer;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _typing = AnimationController(
      vsync: this,
      duration: HotelSplashScreen.typingDuration,
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _finishTimer ??= Timer(HotelSplashScreen.titleHoldDuration, () {
            if (mounted) widget.onFinished();
          });
        }
      });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _typing.value = 1;
    } else {
      _typing.forward();
    }
  }

  @override
  void dispose() {
    _finishTimer?.cancel();
    _typing.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logoSize = math.min(MediaQuery.sizeOf(context).width * .44, 180.0);
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
                            child: AnimatedBuilder(
                              animation: _typing,
                              builder: (context, child) {
                                final count = (_typing.value *
                                        HotelSplashScreen.title.length)
                                    .floor();
                                return Stack(
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
                                      HotelSplashScreen.title.substring(0, count),
                                      key: const ValueKey('splash-typed-title'),
                                      style: titleStyle,
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                );
                              },
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
      ..color = const Color(0x0DFFFFFF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = .7;
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
