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

## Booking behavior

- Choose a room and enter requested stay dates, contact details, guest count, and any extras.
- Pay the existing 5,000 MMK KBZPay deposit and attach the receipt. The app uses the same payment QR and receipt storage as MN-Mart web.
- Stay dates go into the existing booking note for the hotel to review. MN-Mart currently stores one room line and has no date-based availability or nightly quote in the booking API.
- Bookings displays hotel orders from the signed-in account and shows payment, order, and vendor status separately. Pull down to refresh. The session is held in memory and requires sign-in again after an app restart.
- Validate with a test customer and a designated test payment/receipt before distributing this build. Confirm the dashboard displays the dates and status updates and that retrying the same request creates one order.
