import 'package:flutter/material.dart';

import 'api.dart';
import 'hotel_room_widgets.dart';

const _evergreen = Color(0xff164638);

class HotelHomeHeader extends StatelessWidget {
  const HotelHomeHeader({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.query,
    required this.onSearch,
    required this.onClear,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final String query;
  final VoidCallback onSearch;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const Text(
        'Find a stay in Myitkyina',
        style: TextStyle(fontSize: 27, height: 1.15,
          fontWeight: FontWeight.w800, color: _evergreen),
      ),
      const SizedBox(height: 14),
      TextField(
        controller: controller,
        focusNode: focusNode,
        textInputAction: TextInputAction.search,
        maxLength: 80,
        onSubmitted: (_) => onSearch(),
        decoration: InputDecoration(
          labelText: 'Search by hotel name',
          counterText: '',
          filled: true,
          fillColor: Colors.white,
          prefixIcon: const Icon(Icons.search, color: _evergreen),
          suffixIcon: IconButton(
            tooltip: 'Search hotels',
            onPressed: onSearch,
            icon: const Icon(Icons.arrow_forward, color: _evergreen),
          ),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      const SizedBox(height: 16),
      const _ExploreBanner(),
      const SizedBox(height: 18),
      Row(
        children: [
          const Expanded(
            child: Text('Hotels in Myitkyina',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          ),
          if (query.isNotEmpty)
            TextButton(onPressed: onClear, child: const Text('Clear search')),
        ],
      ),
      if (query.isNotEmpty)
        Text('Results for “$query”', style: Theme.of(context).textTheme.bodySmall),
    ],
  );
}

class _ExploreBanner extends StatelessWidget {
  const _ExploreBanner();

  @override
  Widget build(BuildContext context) => ClipRRect(
    borderRadius: BorderRadius.circular(16),
    child: ColoredBox(
      color: const Color(0xfff3dfbd),
      child: LayoutBuilder(
        builder: (context, constraints) => Stack(
          children: [
            Positioned(
              top: 0,
              bottom: 0,
              right: 0,
              width: constraints.maxWidth * .38,
              child: HotelPhoto(image: '/images/mn-hotel.jpg'),
            ),
            Row(
              children: [
                Expanded(
                  flex: 62,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: 108),
                    child: const Padding(
                      padding: EdgeInsets.all(14),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('A weekend in Myitkyina',
                            style: TextStyle(fontSize: 17, height: 1.15,
                              fontWeight: FontWeight.w800, color: _evergreen)),
                          SizedBox(height: 5),
                          Text('Discover local hotels',
                            style: TextStyle(fontSize: 13, color: _evergreen)),
                        ],
                      ),
                    ),
                  ),
                ),
                const Spacer(flex: 38),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

class ExploreHotelCard extends StatelessWidget {
  const ExploreHotelCard({super.key, required this.hotel, required this.onTap});

  final Json hotel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final address = hotel['address']?.toString().trim() ?? '';
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xffe1e6df)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 2.35,
              child: HotelPhoto(image: hotel['image']?.toString() ?? ''),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(hotel['name']?.toString() ?? '',
                          style: const TextStyle(fontSize: 19,
                            fontWeight: FontWeight.w800)),
                        if (address.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.location_on_outlined,
                                size: 17, color: _evergreen),
                              const SizedBox(width: 5),
                              Expanded(child: Text(address)),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.chevron_right, color: _evergreen),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
