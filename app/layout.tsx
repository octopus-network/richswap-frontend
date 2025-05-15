import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

import { Providers } from "@/components/providers";
import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";
import { ConnectWalletModal } from "@/components/connect-wallet-modal";
import { Popups } from "@/components/popups";
import { TransactionUpdater } from "@/components/transaction/updater";
import { GlobalStateUpdater } from "@/components/global-state-updater";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "RichSwap",
  description: "RichSwap",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className={`${GeistSans.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex min-h-screen w-screen flex-col">
              <Topbar />
              <div className="flex flex-1 flex-col sm:p-6 p-3 overflow-y-auto sm:pb-16">
                {children}
              </div>
              <Footer />
              <Popups />
            </div>
            <ConnectWalletModal />
            <TransactionUpdater />
            <GlobalStateUpdater />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
