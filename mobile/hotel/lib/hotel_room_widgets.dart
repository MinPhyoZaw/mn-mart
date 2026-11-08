import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'api.dart';

class HotelPhotoHeader extends StatelessWidget {
  const HotelPhotoHeader({super.key, required this.hotel});
  final Json hotel;

  @override
  Widget build(BuildContext context) => SliverAppBar(
    pinned: true,
    clipBehavior: Clip.antiAlias,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
    ),
    backgroundColor: const Color(0xff205846),
    foregroundColor: Colors.white,
    systemOverlayStyle: SystemUiOverlayStyle.light,
    expandedHeight:
        (MediaQuery.sizeOf(context).height -
            MediaQuery.paddingOf(context).vertical) *
        .33,
    leading: Padding(
      padding: const EdgeInsets.all(4),
      child: Material(
        color: const Color(0x99000000),
        shape: const CircleBorder(),
        child: const BackButton(color: Colors.white),
      ),
    ),
    title: Text(
      hotel['name']?.toString() ?? '',
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
    ),
    flexibleSpace: FlexibleSpaceBar(
      background: ClipRRect(
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
        child: Stack(
          fit: StackFit.expand,
          children: [
            HotelPhoto(image: hotel['image']?.toString() ?? ''),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xA6000000), Color(0x00000000)],
                  stops: [0, .65],
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class HotelPhoto extends StatelessWidget {
  const HotelPhoto({super.key, required this.image});
  final String image;

  @override
  Widget build(BuildContext context) {
    const fallback = ColoredBox(
      color: Color(0xffe6ece7),
      child: Center(
        child: Icon(Icons.hotel_outlined, size: 48, color: Color(0xff205846)),
      ),
    );
    final url = Uri.tryParse(image.trim());
    if (image.trim().isEmpty || url == null) return fallback;
    final resolved = HotelApi.origin.resolveUri(url);
    if (resolved.scheme != 'https') return fallback;
    return Image.network(
      resolved.toString(),
      fit: BoxFit.cover,
      excludeFromSemantics: true,
      errorBuilder: (_, _, _) => fallback,
      loadingBuilder: (_, child, progress) =>
          progress == null ? child : fallback,
    );
  }
}

class StayDatePanel extends StatelessWidget {
  const StayDatePanel({super.key, required this.dates, required this.onTap});
  final DateTimeRange? dates;
  final VoidCallback onTap;

  String label(BuildContext context, DateTime? date) => date == null
      ? 'Select date'
      : MaterialLocalizations.of(context).formatShortDate(date);

  @override
  Widget build(BuildContext context) {
    final selectedDates = dates;
    return Material(
      color: const Color(0xfff7f6f1),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xffdce3dc)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _date(context, 'Check-in', selectedDates?.start),
                  ),
                  const SizedBox(width: 1),
                  Expanded(
                    child: _date(context, 'Check-out', selectedDates?.end),
                  ),
                ],
              ),
            ),
            if (selectedDates != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '${selectedDates.duration.inDays} ${selectedDates.duration.inDays == 1 ? 'night' : 'nights'}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xff205846),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _date(BuildContext context, String heading, DateTime? date) => InkWell(
    borderRadius: BorderRadius.circular(16),
    onTap: onTap,
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          const Icon(
            Icons.calendar_today_outlined,
            size: 18,
            color: Color(0xff205846),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  heading,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xff59665f),
                  ),
                ),
                Text(
                  label(context, date),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class HotelRoomCard extends StatelessWidget {
  const HotelRoomCard({
    super.key,
    required this.room,
    required this.price,
    required this.action,
    required this.onTap,
    required this.status,
  });
  final Json room;
  final String price;
  final String action;
  final String status;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final extra = room['extra'];
    final amenities = extra is Map ? extra['amenities'] : null;
    const labels = {
      'wifi': 'Wi-Fi',
      'aircon': 'Air conditioning',
      'tv': 'TV',
      'breakfast': 'Breakfast',
      'swimmingPool': 'Pool',
      'extraBed': 'Extra bed',
    };
    final facts = <String>[
      if (room['maxGuests'] is num && (room['maxGuests'] as num) > 0)
        'Up to ${room['maxGuests']} guests',
      if (room['bedType']?.toString().trim().isNotEmpty == true)
        room['bedType'].toString(),
      if (amenities is Map)
        ...labels.entries
            .where((e) => amenities[e.key] == true)
            .take(3)
            .map((e) => e.value),
    ];
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: Colors.white,
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xffe1e6df)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: HotelPhoto(image: room['image']?.toString() ?? ''),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  room['name']?.toString() ?? '',
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: price,
                        style: const TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w700,
                          color: Color(0xff205846),
                        ),
                      ),
                      const TextSpan(
                        text: ' / night',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xff59665f),
                        ),
                      ),
                    ],
                  ),
                ),
                if (facts.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 6,
                    children: facts
                        .map(
                          (fact) => Text(
                            fact,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xff59665f),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
                if (status.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Text(status),
                  ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(48, 48),
                    ),
                    onPressed: onTap,
                    child: Text(action, textAlign: TextAlign.center),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
