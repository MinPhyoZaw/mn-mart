import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';

class HotelDetailsHeader extends StatelessWidget {
  const HotelDetailsHeader({super.key, required this.hotel});

  final Json hotel;

  Future<void> callHotel(BuildContext context, String phone) async {
    final number = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    try {
      if (number.isEmpty || !await launchUrl(
        Uri(scheme: 'tel', path: number),
        mode: LaunchMode.externalApplication,
      )) {
        throw StateError('Dialer unavailable');
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to open the dialer. Call $phone.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = hotel['name']?.toString() ?? '';
    final address = hotel['address']?.toString().trim() ?? '';
    final phone = hotel['phone']?.toString().trim() ?? '';
    final canCall = RegExp(r'^\+?[0-9][0-9 ()-]{5,19}$').hasMatch(phone);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: const TextStyle(fontFamily: 'Nunito',
              fontSize: 24, fontWeight: FontWeight.w600, height: 1.25)),
            const SizedBox(height: 10),
            LayoutBuilder(builder: (context, constraints) {
              final addressLine = Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.location_on_outlined, size: 20, color: Color(0xff205846)),
                const SizedBox(width: 6),
                Expanded(child: Text(address.isEmpty ? 'Address not provided' : address,
                  style: const TextStyle(fontSize: 14, height: 1.4, color: Color(0xff59665f)))),
              ]);
              final call = FilledButton.tonalIcon(
                style: FilledButton.styleFrom(minimumSize: const Size(48, 48)),
                onPressed: () => callHotel(context, phone),
                icon: const Icon(Icons.call_outlined, size: 18),
                label: const Text('Call now'),
              );
              if (!canCall) return addressLine;
              if (constraints.maxWidth < 360 || MediaQuery.textScalerOf(context).scale(14) > 18) {
                return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  addressLine, const SizedBox(height: 8), call,
                ]);
              }
              return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(child: addressLine), const SizedBox(width: 12), call,
              ]);
            }),
          ]),
        ),
      ],
    );
  }
}
