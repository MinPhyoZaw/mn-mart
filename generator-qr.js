const QRCode = require("qrcode");

QRCode.toFile(
  "./public/images/mn-mart-qr.png",
  "https://www.mn-mart.store",
  {
    width: 1000,
    margin: 2,
  },
  (error) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log("MN-Mart QR code created!");
  }
);