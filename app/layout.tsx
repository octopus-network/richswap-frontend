import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

export const metadata: Metadata = {
  title: "RichSwap",
  description: "RichSwap",
};

export default function RootLayout({}: // children,
Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased p-4`}>
        Coming soon.
      </body>
    </html>
  );
}
