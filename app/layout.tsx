import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { LaserEyesProvider } from "@omnisat/lasereyes";
import "./globals.css";

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
        <LaserEyesProvider
          config={{
            network: "mainnet",
          }}
        >
          <div className="flex min-h-screen w-screen flex-col">
            <Topbar />
            <div className="flex flex-1 flex-col p-6 overflow-y-auto">
              {children}
            </div>
            <Footer />
            <Popups />
          </div>
          <ConnectWalletModal />
          <TransactionUpdater />
        </LaserEyesProvider>
      </body>
    </html>
  );
}
