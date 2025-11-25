"use client";

import { BaseModal } from "../base-modal";

import { Info } from "lucide-react";
import { useAtom } from "jotai";

import { WalletRow } from "./wallet-row";
import { useTranslations } from "next-intl";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { WALLETS } from "@/lib/constants/wallet";
import { useEffect } from "react";
import { useRee } from "@omnity/ree-client-ts-sdk/react";
import { useLaserEyes } from "@omnisat/lasereyes-react";

export function ConnectWalletModal() {
  const [connectWalletModalOpen, setConnectWalletModalOpen] = useAtom(
    connectWalletModalOpenAtom
  );

  const { address, paymentAddress } = useLaserEyes();

  const { updateWallet } = useRee();

  useEffect(() => {
    updateWallet({ address, paymentAddress });
  }, [address, paymentAddress, updateWallet]);

  const t = useTranslations("ConnectWallet");

  return (
    <BaseModal
      title={t("connectAWallet")}
      open={connectWalletModalOpen}
      setOpen={setConnectWalletModalOpen}
      className="max-w-md"
    >
      <div className="p-5 pt-0">
        <div className="text-lg font-semibold">{t("supportedWallets")}</div>
        <div className="flex flex-col mt-3 gap-1">
          {Object.keys(WALLETS).map((wallet) => (
            <WalletRow wallet={wallet} key={wallet} />
          ))}
        </div>
        <div className="text-xs text-muted-foreground flex items-center mt-4">
          <Info className="size-4 mr-2" /> {t("tips")}
        </div>
      </div>
    </BaseModal>
  );
}
