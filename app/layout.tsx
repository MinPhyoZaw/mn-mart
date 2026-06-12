import "./globals.css";
import Navbar from "./components/NavBar";
import MobileBottomBar from "./components/MobileBottomBar";
import CartDrawer from "./components/CartDrawer";
import SplashVideo from "./components/SplashVideo";
import { CartProvider } from "./context/CartContext";
import { Raleway, Inter } from "next/font/google";



const raleway = Raleway({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-raleway",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata = {
  title: "MN Mart",
  description: "All in one Myitkyina Mart",
  manifest: "/manifest.json",

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en">
    <body
      className={`${inter.variable} ${raleway.variable} font-[var(--font-inter)]`}
    >
      <SplashVideo />

      <CartProvider>
        <Navbar />

        <main className="min-h-screen bg-gray-50 pb-24">
          {children}
        </main>

        <MobileBottomBar />
        <CartDrawer />
      </CartProvider>
    </body>
  </html>
);
}
