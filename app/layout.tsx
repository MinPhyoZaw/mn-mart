import "./globals.css";
import Navbar from "./components/NavBar";
import MobileBottomBar from "./components/MobileBottomBar";
import CartDrawer from "./components/CartDrawer";
import { CartProvider } from "./context/CartContext";
import { Raleway, Inter } from "next/font/google";

const raleway = Raleway({ subsets: ["latin"], weight: ["400", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: "LocalMart",
  description: "Multi Vendor Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${raleway.className} ${inter.className}`}>
        <CartProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-50">{children}</main>
          <MobileBottomBar />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
