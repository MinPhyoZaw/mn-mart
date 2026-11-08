import 'package:flutter/material.dart';

import 'api.dart';

class HotelDetailsHeader extends StatelessWidget {
  const HotelDetailsHeader({super.key, required this.hotel});

  final Json hotel;

  @override
  Widget build(BuildContext context) {
    final name = hotel['name']?.toString() ?? '';
    final address = hotel['address']?.toString().trim() ?? '';
    final image = hotel['image']?.toString().trim() ?? '';
    final url = HotelApi.origin.resolve(image);
    const placeholder = ColoredBox(
      color: Color(0xffe6ece7),
      child: Center(child: Icon(Icons.hotel_outlined,
        size: 64, color: Color(0xff205846))),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Stack(children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
            child: SizedBox(
              key: const ValueKey('hotel-details-photo'),
              height: MediaQuery.sizeOf(context).height * .4,
              width: double.infinity,
              child: image.isEmpty || url.scheme != 'https'
                  ? placeholder
                  : Image.network(url.toString(), fit: BoxFit.cover,
                      semanticLabel: '$name hotel photo',
                      errorBuilder: (_, _, _) => placeholder),
            ),
          ),
          Positioned(
            top: 0, left: 12,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  child: BackButton(color: const Color(0xff205846)),
                ),
              ),
            ),
          ),
        ]),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 22, 20, 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: const TextStyle(fontFamily: 'Nunito',
              fontSize: 24, fontWeight: FontWeight.w600, height: 1.25)),
            const SizedBox(height: 10),
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(Icons.location_on_outlined, size: 20,
                color: Color(0xff205846)),
              const SizedBox(width: 6),
              Expanded(child: Text(address.isEmpty ? 'Address not provided' : address,
                style: const TextStyle(fontSize: 14, height: 1.4,
                  color: Color(0xff59665f)))),
            ]),
          ]),
        ),
      ],
    );
  }
}
