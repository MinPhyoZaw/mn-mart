import 'package:flutter/material.dart';

import 'api.dart';

class HotelHomeHeader extends StatelessWidget {
  const HotelHomeHeader({super.key, required this.controller, required this.focusNode,
    required this.query, required this.onSearch, required this.onClear, required this.onBookings});

  final TextEditingController controller;
  final FocusNode focusNode;
  final String query;
  final VoidCallback onSearch;
  final VoidCallback onClear;
  final VoidCallback onBookings;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const Text('MYITKYINA STAYS', style: TextStyle(fontSize: 11,
        fontWeight: FontWeight.w700, letterSpacing: 1.8, color: Color(0xff205846))),
      const SizedBox(height: 8),
      const Text('Where will you stay?',
        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700)),
      const SizedBox(height: 16),
      TextField(
        controller: controller,
        focusNode: focusNode,
        textInputAction: TextInputAction.search,
        maxLength: 80,
        onSubmitted: (_) => onSearch(),
        decoration: InputDecoration(
          hintText: 'Hotel name or area',
          labelText: 'Find a hotel',
          counterText: '',
          filled: true,
          fillColor: Colors.white,
          prefixIcon: const Icon(Icons.search),
          suffixIcon: IconButton(tooltip: 'Search hotels', onPressed: onSearch,
            icon: const Icon(Icons.arrow_forward)),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      const SizedBox(height: 18),
      if (query.isEmpty) ...[
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(children: [
            Positioned.fill(child: Image.network(
              HotelApi.origin.resolve('/images/mn-hotel.jpg').toString(),
              fit: BoxFit.cover,
              excludeFromSemantics: true,
              errorBuilder: (_, _, _) => const ColoredBox(color: Color(0xff205846)),
            )),
            Positioned.fill(child: DecoratedBox(decoration: BoxDecoration(
              gradient: LinearGradient(colors: [const Color(0xff103c30).withAlpha(245),
                const Color(0xff103c30).withAlpha(180)]),
            ))),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('MAKE ROOM FOR YOUR NEXT TRIP', style: TextStyle(
                  color: Color(0xffe3dbc2), fontSize: 10, letterSpacing: 1.3,
                  fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                const Text('A stay to look\nforward to.', style: TextStyle(
                  color: Colors.white, fontSize: 27, fontWeight: FontWeight.w700, height: 1.1)),
                const SizedBox(height: 10),
                const Text('Explore hotels in Myitkyina. Choose your dates and find an available room.',
                  style: TextStyle(color: Color(0xffe3eee8), height: 1.5)),
                const SizedBox(height: 14),
                FilledButton.icon(
                  onPressed: () => focusNode.requestFocus(),
                  style: FilledButton.styleFrom(backgroundColor: const Color(0xfff3dfae),
                    foregroundColor: const Color(0xff173e30)),
                  icon: const Icon(Icons.search, size: 18),
                  label: const Text('Find your stay'),
                ),
              ]),
            ),
          ]),
        ),
        const SizedBox(height: 14),
        const Wrap(spacing: 8, runSpacing: 8, children: [
          Chip(avatar: Icon(Icons.date_range, size: 16), label: Text('Check room availability')),
          Chip(avatar: Icon(Icons.receipt_long_outlined, size: 16), label: Text('Keep your booking receipt')),
        ]),
        const SizedBox(height: 10),
        Material(
          color: const Color(0xffeaf0e8),
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            onTap: onBookings,
            borderRadius: BorderRadius.circular(16),
            child: const Padding(
              padding: EdgeInsets.all(14),
              child: Row(children: [
                Icon(Icons.bookmark_outline, color: Color(0xff205846)),
                SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Already booked?', style: TextStyle(fontWeight: FontWeight.w700)),
                  Text('View your stay details, status and receipt.', style: TextStyle(fontSize: 12)),
                ])),
                Icon(Icons.chevron_right),
              ]),
            ),
          ),
        ),
        const SizedBox(height: 22),
      ],
      Row(children: [
        Expanded(child: Text(query.isEmpty ? 'Explore hotels' : 'Results for “$query”',
          style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700))),
        if (query.isNotEmpty) TextButton.icon(onPressed: onClear,
          icon: const Icon(Icons.close, size: 16), label: const Text('Clear')),
      ]),
    ],
  );
}
