import { Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { WALLETS } from "@/lib/constants";
import {
  ProviderType,
  useLaserEyes,
  OKX,
  UNISAT,
  PHANTOM,
  XVERSE,
  MAGIC_EDEN,
} from "@omnisat/lasereyes";
import { useCallback, useMemo, useState } from "react";
import { useSetAtom } from "jotai";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";

export function WalletRow({ wallet }: { wallet: string }) {
  const {
    connect,
    isConnecting,
    hasOkx,
    hasUnisat,
    hasPhantom,
    hasXverse,
    hasMagicEden,
  } = useLaserEyes();

  const [connectingWallet, setConnectingWallet] = useState<string>();

  const setConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);
  const addPopup = useAddPopup();

  const installed = useMemo(() => {
    const hasInstalled: Record<string, boolean> = {
      [UNISAT]: hasUnisat,
      [OKX]: hasOkx,
      [PHANTOM]: hasPhantom,
      [MAGIC_EDEN]: hasMagicEden,
      [XVERSE]: hasXverse,
    };

    return hasInstalled[wallet];
  }, [wallet, hasXverse, hasOkx, hasUnisat, hasPhantom, hasMagicEden]);

  const onConnectWallet = useCallback(async () => {
    if (!installed) {
      window.open(WALLETS[wallet].url, "_blank");
    }
    setConnectingWallet(wallet);

    try {
      await connect(wallet as ProviderType);
      setConnectWalletModalOpen(false);
      setConnectingWallet(undefined);
      addPopup(
        "Wallet Connected",
        PopupStatus.INFO,
        `Connected with ${WALLETS[wallet].name}`
      );
    } catch (err) {
      console.log(err);
      setConnectingWallet(undefined);
    }
  }, [
    setConnectingWallet,
    setConnectWalletModalOpen,
    connect,
    wallet,
    addPopup,
    installed,
  ]);

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-secondary/70 hover:bg-secondary px-3 py-2 cursor-pointer first:rounded-t-lg last:rounded-b-lg",
        isConnecting &&
          connectingWallet !== wallet &&
          "pointer-events-none opacity-50"
      )}
      onClick={onConnectWallet}
    >
      <div className="flex items-center">
        <div className="size-10 flex items-center justify-center">
          {connectingWallet === wallet ? (
            <Loader2 className="size-6 animate-spin text-primary" />
          ) : (
            <Image
              src={WALLETS[wallet].icon}
              className="size-8 rounded-lg"
              alt={WALLETS[wallet].name}
              width={64}
              height={64}
            />
          )}
        </div>
        <span className="font-semibold text-lg ml-2">
          {WALLETS[wallet].name}
        </span>
      </div>
      {installed && (
        <span className="text-muted-foreground/80 text-xs">Detected</span>
      )}
    </div>
  );
}
