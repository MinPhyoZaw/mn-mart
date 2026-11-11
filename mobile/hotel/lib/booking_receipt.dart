import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_file_dialog/flutter_file_dialog.dart';

import 'package:qr_flutter/qr_flutter.dart';

import 'api.dart';

String _value(Json data, String key, [String fallback = '']) =>
    data[key]?.toString() ?? fallback;

num _amount(Object? value) => num.tryParse(value?.toString() ?? '') ?? 0;

String _money(num amount) => '${amount.toStringAsFixed(0).replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (match) => '${match[1]},')} MMK';

DateTime? _date(Object? value) {
  if (value is! String || !RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(value)) return null;
  final parsed = DateTime.tryParse('${value}T00:00:00Z');
  return parsed != null && parsed.toIso8601String().startsWith(value) ? parsed : null;
}

String _dateLabel(DateTime date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}

class BookingReceipt extends StatefulWidget {
  const BookingReceipt({super.key, required this.order});
  final Json order;

  @override
  State<BookingReceipt> createState() => _BookingReceiptState();
}

class _BookingReceiptState extends State<BookingReceipt> {
  final receiptKey = GlobalKey();
  final qrKey = GlobalKey();
  bool saving = false;

  Future<void> download({bool qrOnly = false}) async {
    if (saving) return;
    setState(() => saving = true);
    final label = qrOnly ? 'QR code' : 'receipt';
    ui.Image? image;
    try {
      await WidgetsBinding.instance.endOfFrame;
      if (!mounted) return;
      final boundary = (qrOnly ? qrKey : receiptKey).currentContext?.findRenderObject();
      if (boundary is! RenderRepaintBoundary) throw StateError('Receipt is not ready.');
      image = await boundary.toImage(pixelRatio: 3);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      if (bytes == null) throw StateError('Could not prepare receipt.');
      if (!mounted) return;
      final reference = _value(widget.order, 'hotelReference', 'hotel-booking');
      final safeName = reference.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '-');
      final saved = await FlutterFileDialog.saveFile(params: SaveFileDialogParams(
        data: bytes.buffer.asUint8List(bytes.offsetInBytes, bytes.lengthInBytes),
        fileName: '$safeName-${qrOnly ? 'qr' : 'receipt'}.png',
        mimeTypesFilter: const ['image/png'],
      ));
      if (mounted && saved != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label saved.')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not save the $label. Please try again.')),
        );
      }
    } finally {
      image?.dispose();
      if (mounted) setState(() => saving = false);
    }
  }

  Widget detail(String label, String value, {bool strong = false}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 7),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(flex: 2, child: Text(label, style: const TextStyle(color: Color(0xff626e67)))),
      const SizedBox(width: 12),
      Expanded(flex: 3, child: Text(value, textAlign: TextAlign.end,
        style: TextStyle(fontWeight: strong ? FontWeight.w700 : FontWeight.w500))),
    ]),
  );

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final rawDetails = order['bookingDetails'];
    final details = rawDetails is Json ? rawDetails : <String, dynamic>{};
    final checkIn = _date(details['checkIn']);
    final checkOut = _date(details['checkOut']);
    final nights = checkIn == null || checkOut == null ? null : checkOut.difference(checkIn).inDays;
    final total = _amount(order['totalAmount']);
    const deposit = 5000;
    final paid = order['paymentStatus'] == 'paid';
    final status = _bookingStatus(order);
    final rejected = status == 'Rejected';
    final confirmed = status == 'Confirmed';
    final statusIcon = rejected ? Icons.cancel_outlined : confirmed ? Icons.verified_rounded : Icons.schedule_rounded;
    final statusColor = _statusColor(status);
    final statusBackground = statusColor.withAlpha(22);
    final reference = _reference(order);
    final roomType = _roomType(order);
    final phone = _value(order, 'hotelPhone');
    final customerName = _value(order, 'customerName').trim();
    final dateRange = checkIn != null && checkOut != null
        ? '${_dateLabel(checkIn)} → ${_dateLabel(checkOut)}' : 'Dates need review';
    final depositStatus = paid ? 'Paid' : order['paymentStatus'] == 'rejected' ? 'Rejected' : 'Awaiting verification';

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        RepaintBoundary(
          key: receiptKey,
          child: DecoratedBox(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xffdce6df))),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                const Text('MANAW MART HOTEL', style: TextStyle(color: Color(0xff205846),
                  fontWeight: FontWeight.w700, fontSize: 11, letterSpacing: 1.6)),
                const SizedBox(height: 8),
                Text(_value(order, 'shopName', 'Hotel booking'),
                  style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Align(alignment: Alignment.centerLeft, child: Semantics(
                  label: 'Booking $status',
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(color: statusBackground, borderRadius: BorderRadius.circular(24)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(statusIcon, size: 19, color: statusColor),
                      const SizedBox(width: 7),
                      Text(status, style: TextStyle(color: statusColor, fontWeight: FontWeight.w700)),
                    ]),
                  ),
                )),
                const SizedBox(height: 12),
                detail('ORD NO', reference.replaceFirst('MH-', 'MH - '), strong: true),
                detail('Room type', roomType),
                if (customerName.isNotEmpty) detail('Customer', customerName),
                const Divider(height: 28),
                detail('Stay duration', dateRange),
                if (nights != null && nights > 0)
                  detail('Total stay', '$nights ${nights == 1 ? 'night' : 'nights'}'),
                const Divider(height: 28),
                detail('Total price', _money(total), strong: true),
                detail('Deposit', '${_money(deposit)}\n$depositStatus'),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xfff0f6f2), borderRadius: BorderRadius.circular(12)),
                  child: detail('Left to pay', _money((total - deposit).clamp(0, double.infinity)), strong: true),
                ),
                if (!paid) Padding(padding: const EdgeInsets.only(top: 8), child: Text(
                  rejected ? 'Deposit is not verified. Contact the hotel about any transfer.'
                    : 'Balance shown after deposit verification.',
                  style: const TextStyle(fontSize: 12, color: Color(0xff626e67)),
                )),
                const Divider(height: 28),
                detail('Hotel phone', phone.isEmpty ? 'Not provided' : phone),
                const SizedBox(height: 8),
                Align(
                  child: RepaintBoundary(
                    key: qrKey,
                    child: QrImageView(
                      data: [
                        'MN Mart Hotel booking',
                        'Order: $reference',
                        'Hotel: ${_value(order, 'shopName', 'Hotel booking')}',
                        'Room: $roomType',
                        if (customerName.isNotEmpty) 'Customer: $customerName',
                        'Stay: $dateRange',
                        'Status at export: $status',
                      ].join('\n'),
                      size: 208,
                      backgroundColor: Colors.white,
                      padding: const EdgeInsets.all(16),
                      semanticsLabel: 'QR code with the booking summary',
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text('Booking receipt · $status', textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11, color: Color(0xff626e67))),
              ]),
            ),
          ),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: saving ? null : () => download(),
          icon: saving ? const SizedBox(width: 18, height: 18,
            child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.download_outlined),
          label: Text(saving ? 'Preparing download…' : 'Download receipt'),
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: saving ? null : () => download(qrOnly: true),
          icon: const Icon(Icons.qr_code),
          label: const Text('Download QR only'),
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        ),
      ]),
    );
  }
}


String _reference(Json order) =>
    _value(order, 'hotelReference', _value(order, 'orderId', 'Preparing reference'));

String _roomType(Json order) {
  final details = order['bookingDetails'];
  return _value(order, 'hotelRoomType',
    details is Json ? _value(details, 'roomType', 'Room details unavailable')
        : 'Room details unavailable');
}

String _bookingStatus(Json order) {
  if (order['orderStatus'] == 'rejected' || order['vendorStatus'] == 'rejected' ||
      order['paymentStatus'] == 'rejected') {
    return 'Rejected';
  }
  if (order['orderStatus'] == 'confirmed' && order['vendorStatus'] == 'accepted') {
    return 'Confirmed';
  }
  return 'Pending';
}

Color _statusColor(String status) => switch (status) {
  'Rejected' => const Color(0xffa52d32),
  'Confirmed' => const Color(0xff205846),
  _ => const Color(0xff895b08),
};

class BookingOrderCard extends StatelessWidget {
  const BookingOrderCard({super.key, required this.order});

  final Json order;

  @override
  Widget build(BuildContext context) {
    final status = _bookingStatus(order);
    final color = _statusColor(status);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: CustomPaint(
        foregroundPainter: const _DottedOrderBorder(),
        child: DecoratedBox(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 12,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(_reference(order).replaceFirst('MH-', 'MH - '),
                      style: Theme.of(context).textTheme.labelLarge),
                    DecoratedBox(
                      decoration: BoxDecoration(color: color.withAlpha(22),
                        borderRadius: BorderRadius.circular(20)),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        child: Text(status, style: TextStyle(color: color)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(_value(order, 'shopName', 'Hotel booking'),
                  style: Theme.of(context).textTheme.titleMedium),
                Text(_roomType(order), style: Theme.of(context).textTheme.bodySmall),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    onPressed: () => Navigator.of(context).push<void>(
                      MaterialPageRoute(builder: (_) => Scaffold(
                        appBar: AppBar(title: const Text('Booking details')),
                        body: SafeArea(
                          child: ListView(
                            padding: const EdgeInsets.all(16),
                            children: [BookingReceipt(order: order)],
                          ),
                        ),
                      )),
                    ),
                    icon: const Icon(Icons.receipt_long_outlined),
                    label: const Text('Show details'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DottedOrderBorder extends CustomPainter {
  const _DottedOrderBorder();

  @override
  void paint(Canvas canvas, Size size) {
    final outline = Path()..addRRect(RRect.fromRectAndRadius(
      (Offset.zero & size).deflate(1), const Radius.circular(15),
    ));
    final paint = Paint()..color = const Color(0xff76978a);
    for (final edge in outline.computeMetrics()) {
      for (var distance = 0.0; distance < edge.length; distance += 5) {
        final point = edge.getTangentForOffset(distance);
        if (point != null) canvas.drawCircle(point.position, 0.9, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DottedOrderBorder oldDelegate) => false;
}
