# Manaw Mart Hotel

Standalone Android Flutter app with application ID `store.mn_mart.hotel`. The project uses the MN-Mart hotel catalog, customer sign-in, booking endpoint, and customer order history. MN-Mart's dashboard remains the place to review requests.

## Run on Windows

From the repository root, open PowerShell.

```powershell
cd mobile/hotel
$flutter = "C:\Users\ASUS\development-flutter\flutter\bin\flutter.bat"
.\setup-android.ps1 -Flutter $flutter
& $flutter pub get
& $flutter analyze
& $flutter run -d 5TV449IFKZYPSWFE
```

Run the setup script once per checkout to generate the native Android project. You can browse the live catalog and sign in with the command above.

For receipt uploads, create `hotel-local.json` in this folder with the public Supabase anon or publishable key from the MN-Mart deployment. Use the production Supabase URL and receipt bucket if they differ from the defaults. Keep privileged keys out of the app.

```json
{
  "SUPABASE_ANON_KEY": "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY",
  "SUPABASE_URL": "https://yypxmsjyzplvtnkmnvgp.supabase.co",
  "SUPABASE_RECEIPT_BUCKET": "receipt-upload"
}
```

```powershell
& $flutter run -d 5TV449IFKZYPSWFE --dart-define-from-file=hotel-local.json
```

## Backend deployment

Deploy the backend changes from this branch before distributing the updated Flutter build. The app requires date availability from the shop details API.

Hotel owners add one physical room per listing with a unique room number/name, room type, nightly price, capacity, and amenities. In **Your Rooms → Room details & dates**, they can edit details, record phone/walk-in reservations, and add or remove maintenance blocks. The availability switch pauses all new bookings for a room.

Pending requests reserve their dates until rejected by the admin or hotel owner. Check-out does not occupy a night, so another stay can begin on that date. Older active bookings without structured dates block new requests until the owner assigns their dates in the calendar. Existing booking prices are retained when assigning historical dates.

Backend checks use MongoDB transactions and require a replica set, as provided by MongoDB Atlas. Before launch, verify the Item unique index for shopId + roomNumber exists. Existing records without room numbers remain readable. New room numbers must be unique within their hotel.

Run `npm run test:hotel` for date validation tests. To run the database integration tests as well, set `HOTEL_TEST_MONGODB_URI` to a dedicated disposable replica-set database named `hotel-tests` (or prefixed `hotel-tests-`). The integration tests clear their test collections. Use a separate test database.

## Booking behavior

- Choose a room and enter requested stay dates, contact details, guest count, and any extras.
- Pay the existing 5,000 MMK KBZPay deposit and attach the receipt. The app uses the same payment QR and receipt storage as MN-Mart web.
- Check-in, check-out, and night count are stored as structured booking details. Each listing represents one physical room. The backend checks date availability again during submission and calculates the stay total from its nightly price.
- Bookings displays hotel orders from the signed-in account and shows payment, order, and vendor status separately. Pull down to refresh. The session is held in memory and requires sign-in again after an app restart.
- Validate with a test customer and a designated test payment/receipt before distributing this build. Confirm the dashboard displays the dates and status updates and that retrying the same request creates one order.
