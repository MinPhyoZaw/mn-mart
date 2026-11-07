import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'api.dart';

void main() => runApp(const HotelApp());

String field(Json data, String key, [String fallback = '']) =>
    data[key]?.toString() ?? fallback;

String mmk(Object? value) {
  final digits = value?.toString() ?? '0';
  return '${digits.replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} MMK';
}


const List<Json> sampleHotels = [
  {
    '_id': 'sample-riverside',
    'name': 'Manaw Riverside Hotel',
    'description': 'Sample hotel · A peaceful riverside stay in Myitkyina.',
    'isSample': true,
    'sampleRooms': [
      {
        '_id': 'sample-riverside-double',
        'name': 'River View Double Room',
        'description': 'Sample room with a double bed for two guests.',
        'price': 50000,
        'isSample': true,
        'extra': {
          'amenities': {'wifi': true, 'aircon': true, 'breakfast': true},
        },
      },
      {
        '_id': 'sample-riverside-family',
        'name': 'Family Room',
        'description': 'Sample family room for up to four guests.',
        'price': 85000,
        'isSample': true,
        'extra': {
          'amenities': {'wifi': true, 'aircon': true, 'tv': true, 'extraBed': true},
        },
      },
    ],
  },
  {
    '_id': 'sample-hill-garden',
    'name': 'Kachin Hill Garden Hotel',
    'description': 'Sample hotel · A relaxed garden stay in Myitkyina.',
    'isSample': true,
    'sampleRooms': [
      {
        '_id': 'sample-garden-twin',
        'name': 'Garden Twin Room',
        'description': 'Sample room with two single beds for two guests.',
        'price': 45000,
        'isSample': true,
        'extra': {
          'amenities': {'wifi': true, 'aircon': true, 'tv': true},
        },
      },
      {
        '_id': 'sample-garden-suite',
        'name': 'Garden Suite',
        'description': 'Sample suite with a sitting area for two guests.',
        'price': 95000,
        'isSample': true,
        'extra': {
          'amenities': {'wifi': true, 'aircon': true, 'breakfast': true, 'extraBed': true},
        },
      },
    ],
  },
];

class HotelApp extends StatefulWidget {
  const HotelApp({super.key});
  @override
  State<HotelApp> createState() => _HotelAppState();
}

class _HotelAppState extends State<HotelApp> {
  final api = HotelApi();

  @override
  void dispose() {
    api.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Manaw Mart Hotel',
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff205846)),
      scaffoldBackgroundColor: const Color(0xfff7f6f1),
      inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
    ),
    home: Home(api: api),
  );
}

class Home extends StatefulWidget {
  const Home({super.key, required this.api});
  final HotelApi api;
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  int tab = 0;
  int historyVersion = 0;
  HotelApi get api => widget.api;

  Future<bool> signIn() async {
    if (api.user != null) return true;
    final signedIn = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => SignIn(api: api)),
    );
    if (mounted && signedIn == true) setState(() => historyVersion++);
    return mounted && signedIn == true;
  }

  Future<void> openHotel(Json hotel) async {
    final submitted = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => Rooms(api: api, hotel: hotel, signIn: signIn),
    ));
    if (mounted && submitted == true) setState(() { tab = 1; historyVersion++; });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Manaw Mart Hotel')),
    body: SafeArea(child: switch (tab) {
      0 => PagedList(
        key: const ValueKey('hotels'),
        intro: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('MYITKYINA  •  HOTEL BOOKINGS', style: TextStyle(letterSpacing: 1.5)),
          SizedBox(height: 8),
          Text('Find your next stay', style: TextStyle(fontSize: 31, fontWeight: FontWeight.bold)),
        ]),
        empty: 'No hotels are listed yet.',
        load: (page) async {
          final result = await api.hotels(page);
          final hotels = (result['data'] as List).cast<Json>();
          if (page == 1 && hotels.isEmpty && result['meta']['total'] == 0) {
            return (rows: sampleHotels, more: false);
          }
          return (rows: hotels,
              more: page < (result['meta']['totalPages'] as num));
        },
        item: (hotel) => Listing(data: hotel, action: 'View rooms', onTap: () => openHotel(hotel)),
      ),
      1 => api.user == null
        ? Center(child: FilledButton(onPressed: signIn, child: const Text('Sign in to view bookings')))
        : PagedList(
          key: ValueKey('bookings-$historyVersion'),
          intro: const Text('My hotel bookings', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
          empty: 'No hotel bookings yet.',
          load: (page) async {
            try {
              final result = await api.orders(page);
              return (rows: (result['data'] as List).cast<Json>()
                .where((order) => order['serviceType'] == 'hotel').toList(),
                more: result['pagination']['hasNextPage'] == true);
            } on ApiError catch (error) {
              if (error.status == 401 && mounted) setState(() {});
              rethrow;
            }
          },
          item: (order) {
            final items = (order['items'] as List? ?? []).cast<Json>();
            return Card(child: ListTile(
              title: Text(field(order, 'shopName', 'Hotel')),
              subtitle: Text([
                if (items.isNotEmpty) items.map((item) => field(item, 'name')).join(', '),
                field(order, 'orderId'),
                'Payment: ${field(order, 'paymentStatus', 'pending')}',
                'Booking: ${field(order, 'orderStatus', 'pending')}',
                'Hotel response: ${field(order, 'vendorStatus', 'new')}',
              ].join('\n')),
            ));
          },
        ),
      _ => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(api.user == null ? 'Use your MN-Mart customer account' : field(api.user!, 'email')),
        const SizedBox(height: 12),
        if (api.user == null)
          FilledButton(onPressed: signIn, child: const Text('Sign in'))
        else
          OutlinedButton(onPressed: () => setState(api.signOut), child: const Text('Sign out')),
      ])),
    }),
    bottomNavigationBar: NavigationBar(
      selectedIndex: tab,
      onDestinationSelected: (value) => setState(() => tab = value),
      destinations: const [
        NavigationDestination(icon: Icon(Icons.hotel_outlined), label: 'Explore'),
        NavigationDestination(icon: Icon(Icons.calendar_month_outlined), label: 'Bookings'),
        NavigationDestination(icon: Icon(Icons.person_outline), label: 'Account'),
      ],
    ),
  );
}

typedef PageResult = ({List<Json> rows, bool more});

class PagedList extends StatefulWidget {
  const PagedList({super.key, required this.intro, required this.empty,
    required this.load, required this.item});
  final Widget intro;
  final String empty;
  final Future<PageResult> Function(int page) load;
  final Widget Function(Json row) item;

  @override
  State<PagedList> createState() => _PagedListState();
}

class _PagedListState extends State<PagedList> {
  List<Json> rows = [];
  int next = 1;
  bool more = true;
  bool loading = false;
  String? error;

  @override
  void initState() {
    super.initState();
    fetch();
  }

  Future<void> fetch({bool refresh = false}) async {
    if (loading) return;
    setState(() { loading = true; error = null; });
    try {
      final page = refresh ? 1 : next;
      final result = await widget.load(page);
      if (!mounted) return;
      setState(() {
        rows = [if (!refresh) ...rows, ...result.rows];
        next = page + 1;
        more = result.more;
      });
    } catch (e) {
      if (mounted) setState(() => error = e is ApiError ? e.message : 'Unable to load data.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: () => fetch(refresh: true),
    child: ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        widget.intro,
        const SizedBox(height: 16),
        ...rows.map(widget.item),
        if (loading)
          const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
        else if (error != null)
          Column(children: [Text(error!), TextButton(onPressed: fetch, child: const Text('Retry'))])
        else if (more)
          OutlinedButton(onPressed: fetch, child: Text(rows.isEmpty ? 'Search next page' : 'Load more'))
        else if (rows.isEmpty)
          Center(child: Text(widget.empty)),
      ],
    ),
  );
}

class Listing extends StatelessWidget {
  const Listing({super.key, required this.data, required this.action, required this.onTap,
    this.details = ''});
  final Json data;
  final String action;
  final String details;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final url = HotelApi.origin.resolve(field(data, 'image'));
    final placeholder = ColoredBox(
      color: Theme.of(context).colorScheme.secondaryContainer,
      child: const Center(child: Icon(Icons.hotel_outlined, size: 42)),
    );
    return Card(
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SizedBox(height: 150, child: field(data, 'image').isEmpty || url.scheme != 'https'
          ? placeholder
          : Image.network(url.toString(), fit: BoxFit.cover, errorBuilder: (_, _, _) => placeholder)),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (data['isSample'] == true) ...[
              const Chip(
                avatar: Icon(Icons.visibility_outlined, size: 18),
                label: Text('Sample · Preview only'),
              ),
              const SizedBox(height: 4),
            ],
            Text(field(data, 'name'), style: Theme.of(context).textTheme.titleLarge),
            if (field(data, 'description').isNotEmpty) Text(field(data, 'description')),
            if (details.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(details)),
            const SizedBox(height: 8),
            FilledButton.tonal(onPressed: onTap, child: Text(action)),
          ]),
        ),
      ]),
    );
  }
}

class Rooms extends StatelessWidget {
  const Rooms({super.key, required this.api, required this.hotel, required this.signIn});
  final HotelApi api;
  final Json hotel;
  final Future<bool> Function() signIn;

  @override
  Widget build(BuildContext context) {
    final shop = field(hotel, '_id');
    final isSample = hotel['isSample'] == true;
    return Scaffold(
      appBar: AppBar(title: Text(field(hotel, 'name'))),
      body: PagedList(
        intro: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Rooms', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
          if (isSample) ...[
            const SizedBox(height: 8),
            const Text('This fictional hotel is for previewing the app. Prices are examples.'),
          ],
        ]),
        empty: 'No rooms are listed for this hotel.',
        load: (page) async {
          if (isSample) {
            return (rows: (hotel['sampleRooms'] as List).cast<Json>(), more: false);
          }
          final result = await api.rooms(shop, page);
          final data = result['data'] as Json;
          final active = data['shop']['isActive'] != false;
          return (rows: active ? (data['items'] as List).cast<Json>()
              .where((room) => room['type'] == 'room' && room['isAvailable'] != false).toList() : <Json>[],
              more: active && data['pagination']['hasNextPage'] == true);
        },
        item: (room) {
          final extra = room['extra'];
          final amenities = extra is Json ? extra['amenities'] : null;
          final labels = const {'wifi': 'Wi-Fi', 'aircon': 'Air conditioning', 'tv': 'TV',
            'breakfast': 'Breakfast', 'swimmingPool': 'Pool', 'extraBed': 'Extra bed'};
          return Listing(data: room,
            action: isSample ? 'Sample room · Booking unavailable' : 'Request booking',
            details: [
              mmk(room['price']),
              if (amenities is Json)
                labels.entries.where((e) => amenities[e.key] == true).map((e) => e.value).join(' · '),
            ].where((line) => line.isNotEmpty).join('\n'),
            onTap: isSample ? null : () async {
              if (!await signIn() || !context.mounted) return;
              final booked = await Navigator.of(context).push<bool>(MaterialPageRoute(
                builder: (_) => BookingForm(api: api, hotel: hotel, room: room, signIn: signIn),
              ));
              if (booked == true && context.mounted) Navigator.of(context).pop(true);
            },
          );
        },
      ),
    );
  }
}

class SignIn extends StatefulWidget {
  const SignIn({super.key, required this.api});
  final HotelApi api;
  @override
  State<SignIn> createState() => _SignInState();
}

class _SignInState extends State<SignIn> {
  final email = TextEditingController();
  final password = TextEditingController();
  bool busy = false;
  String? error;

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (busy) return;
    setState(() { busy = true; error = null; });
    try {
      await widget.api.signIn(email.text.trim(), password.text);
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() {
        busy = false;
        error = e is ApiError ? e.message : 'Unable to sign in.';
      });
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !busy,
    child: Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        const Text('Use your existing MN-Mart customer account.'),
        const SizedBox(height: 12),
        TextField(controller: email, keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email], decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: 12),
        TextField(controller: password, obscureText: true,
          autofillHints: const [AutofillHints.password], decoration: const InputDecoration(labelText: 'Password')),
        if (error != null) Text(error!),
        const SizedBox(height: 12),
        FilledButton(onPressed: busy ? null : submit, child: Text(busy ? 'Signing in…' : 'Sign in')),
      ]),
    ),
  );
}

class BookingForm extends StatefulWidget {
  const BookingForm({super.key, required this.api, required this.hotel, required this.room,
    required this.signIn});
  final HotelApi api;
  final Json hotel;
  final Json room;
  final Future<bool> Function() signIn;
  @override
  State<BookingForm> createState() => _BookingFormState();
}

class _BookingFormState extends State<BookingForm> {
  final form = GlobalKey<FormState>();
  final phone = TextEditingController();
  final guests = TextEditingController(text: '1');
  final beds = TextEditingController(text: '0');
  final note = TextEditingController();
  final key = bookingKey();
  late final name = TextEditingController(text: field(widget.api.user ?? {}, 'name'));
  DateTimeRange? dates;
  XFile? receipt;
  String? receiptUrl;
  String? error;
  bool busy = false;
  bool attempted = false;

  @override
  void dispose() {
    for (final controller in [name, phone, guests, beds, note]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> pickDates() async {
    final now = DateTime.now().toUtc().add(const Duration(hours: 6, minutes: 30));
    final today = DateTime(now.year, now.month, now.day);
    final selected = await showDateRangePicker(
      context: context, firstDate: today, currentDate: today,
      lastDate: DateTime(today.year + 1, today.month, today.day),
      initialDateRange: dates,
    );
    if (selected != null && mounted) setState(() => dates = selected);
  }

  Future<void> pickReceipt() async {
    try {
      final image = await ImagePicker().pickImage(source: ImageSource.gallery);
      if (mounted && image != null) setState(() { receipt = image; receiptUrl = null; });
    } catch (_) {
      if (mounted) setState(() => error = 'Could not open the photo picker.');
    }
  }

  String dateText(DateTime date) => date.toIso8601String().split('T').first;

  Future<void> submit() async {
    if (widget.hotel['isSample'] == true || widget.room['isSample'] == true) return;
    if (busy || !form.currentState!.validate()) return;
    final stay = dates;
    final image = receipt;
    if (stay == null || !stay.end.isAfter(stay.start) || image == null) {
      setState(() => error = 'Choose different check-in and check-out dates and attach your receipt.');
      return;
    }

    setState(() { busy = true; error = null; });
    final api = widget.api;
    final shop = field(widget.hotel, '_id');
    try {
      if (!await widget.signIn() || !mounted) return;
      receiptUrl ??= await api.uploadReceipt(shop, image);
      if (!mounted) return;
      setState(() => attempted = true);
      final result = await api.book({
        'shopId': shop,
        'roomItemId': field(widget.room, '_id'),
        'customerName': name.text.trim(),
        'customerPhone': phone.text.trim(),
        'guestCount': int.parse(guests.text.trim()),
        'extraBedAmount': int.parse(beds.text.trim()),
        'note': 'Requested check-in: ${dateText(stay.start)}\n'
            'Requested check-out: ${dateText(stay.end)}\n${note.text.trim()}'.trimRight(),
        'receiptImage': receiptUrl,
        'paymentProvider': 'kbzpay_2',
        'bookingKey': key,
      });
      if (!mounted) return;
      final id = field(result['data'] as Json, 'orderId');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Request sent · $id')));
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => error = e is ApiError ? e.message : 'Could not submit the booking.');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Widget input(TextEditingController controller, String label, {
    TextInputType keyboard = TextInputType.text, String? Function(String?)? validate,
    int? maxLength,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: controller, keyboardType: keyboard, enabled: !busy && !attempted,
      decoration: InputDecoration(labelText: label),
      validator: validate, maxLength: maxLength,
    ),
  );

  String? requiredField(String? value) =>
      (value?.trim().isEmpty ?? true) ? 'Required' : null;

  String? count(String? value, int minimum) {
    final number = int.tryParse(value?.trim() ?? '');
    return number == null || number < minimum ? 'Enter a whole number of at least $minimum.' : null;
  }

  @override
  Widget build(BuildContext context) {
    final stay = dates;
    final ready = widget.api.canUpload;
    return PopScope(
      canPop: !busy,
      child: Scaffold(
        appBar: AppBar(title: const Text('Request a room')),
        body: Form(
          key: form,
          child: ListView(padding: const EdgeInsets.all(20), children: [
            Text(field(widget.room, 'name'), style: Theme.of(context).textTheme.headlineSmall),
            Text(field(widget.hotel, 'name')),
            const SizedBox(height: 8),
            const Text('The hotel will review your requested dates and confirm availability.'),
            OutlinedButton.icon(
              onPressed: busy || attempted ? null : pickDates,
              icon: const Icon(Icons.date_range),
              label: Text(stay == null ? 'Select check-in and check-out'
                : '${dateText(stay.start)} to ${dateText(stay.end)}'),
            ),
            const SizedBox(height: 12),
            input(name, 'Guest name', validate: requiredField, maxLength: 100),
            input(phone, 'Phone number', keyboard: TextInputType.phone,
              validate: requiredField, maxLength: 30),
            input(guests, 'Guests', keyboard: TextInputType.number,
              validate: (value) => count(value, 1), maxLength: 3),
            input(beds, 'Extra beds', keyboard: TextInputType.number,
              validate: (value) => count(value, 0), maxLength: 3),
            input(note, 'Note (optional)', maxLength: 300),
            if (ready) ...[
              const Text('KBZPay deposit · 5,000 MMK', style: TextStyle(fontWeight: FontWeight.bold)),
              const Text('Scan the MN-Mart payment QR, then attach your receipt.'),
              Center(child: Image.network(
                HotelApi.origin.resolve('/images/payment/kbzpay-2.jpg').toString(),
                width: 240,
                errorBuilder: (_, _, _) => const Text('Payment QR unavailable. Refresh your connection before paying.'),
              )),
              OutlinedButton.icon(
                onPressed: busy || attempted ? null : pickReceipt,
                icon: const Icon(Icons.attach_file),
                label: Text(receipt == null ? 'Attach receipt' : receipt!.name,
                  overflow: TextOverflow.ellipsis),
              ),
            ] else
              const Text('Booking payments are unavailable in this build.'),
            if (error != null) Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: busy || !ready ? null : submit,
              child: Text(busy ? 'Sending…' : attempted ? 'Retry same request' : 'Send booking request'),
            ),
          ]),
        ),
      ),
    );
  }
}
