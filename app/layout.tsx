import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

import { Providers } from "@/components/providers";
import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";
import { ConnectWalletModal } from "@/components/connect-wallet-modal";
import { Popups } from "@/components/popups";
import { TransactionUpdater } from "@/components/transaction/updater";

export const metadata: Metadata = {
  title: "RichSwap",
  description: "RichSwap",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased`}>
        <Providers>
          <div className="flex min-h-screen w-screen flex-col">
            <Topbar />
            <div className="flex flex-1 flex-col p-6 overflow-y-auto pb-16">
              {children}
            </div>
            <Footer />
            <Popups />
          </div>
          <ConnectWalletModal />
          <TransactionUpdater />
        </Providers>
      </body>
    </html>
  );
}
