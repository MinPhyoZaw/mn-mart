import "./globals.css";
import Navbar from "./components/NavBar";
import MobileBottomBar from "./components/MobileBottomBar";
import {Raleway , Inter} from 'next/font/google';

const raleway = Raleway({ subsets: ['latin'], weight: ['400', '700'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] });

export const metadata = {
  title: "LocalMart",
  description: "Multi Vendor Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${raleway.className} ${inter.className}`}>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <MobileBottomBar/>
      </body>
    </html>
  );
}
