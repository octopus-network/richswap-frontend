"use client";

import { BaseModal } from "../base-modal";

import { Info } from "lucide-react";
import { useAtom } from "jotai";

import { WalletRow } from "./wallet-row";

import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { WALLETS } from "@/lib/constants/wallet";

export function ConnectWalletModal() {
  const [connectWalletModalOpen, setConnectWalletModalOpen] = useAtom(
    connectWalletModalOpenAtom
  );

  return (
    <BaseModal
      title="Connect a Wallet"
      open={connectWalletModalOpen}
      setOpen={setConnectWalletModalOpen}
      className="max-w-md"
    >
      <div className="p-5 pt-0">
        <div className="text-lg font-semibold">
          Supported Wallets
        </div>
        <div className="flex flex-col mt-3 gap-1">
          {Object.keys(WALLETS).map((wallet) => (
            <WalletRow wallet={wallet} key={wallet} />
          ))}
        </div>
        <div className="text-xs text-muted-foreground flex items-center mt-4">
          <Info className="size-4 mr-2" /> To use RichSwap, you need to connect
          a wallet
        </div>
      </div>
    </BaseModal>
  );
}
