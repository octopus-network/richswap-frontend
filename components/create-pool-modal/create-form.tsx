import { Coin } from "@/types";
import { CoinField } from "../coin-field";
import { Loader2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { useLaserEyes } from "@omnisat/lasereyes";
import { useSetAtom } from "jotai";
import { useCoinBalance } from "@/hooks/use-balance";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { useMemo, useState } from "react";
import Decimal from "decimal.js";
import { useCoinPrice } from "@/hooks/use-prices";
import { Exchange } from "@/lib/exchange";
import { PopupStatus, useAddPopup } from "@/store/popups";
import { getCoinSymbol } from "@/lib/utils";

export function CreateForm({
  coinA,
  coinB,
  setCoinB,
  coinAAmount,
  coinBAmount,
  setCoinAAmount,
  setCoinBAmount,
  onNextStep,
}: {
  coinA: Coin;
  coinB: Coin | null;
  setCoinB: (coin: Coin) => void;
  coinAAmount: string;
  coinBAmount: string;
  setCoinAAmount: (value: string) => void;
  setCoinBAmount: (value: string) => void;
  onNextStep: (key: string) => void;
}) {
  const { address } = useLaserEyes();
  const [isCreating, setIsCreating] = useState(false);
  const coinABalance = useCoinBalance(address, coinA?.id);
  const coinBBalance = useCoinBalance(address, coinB?.id);

  const addPopup = useAddPopup();
  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  const coinAPrice = useCoinPrice(coinA?.id);
  const coinAFiatValue = useMemo(
    () =>
      coinAAmount && coinAPrice ? Number(coinAAmount) * coinAPrice : undefined,
    [coinAAmount, coinAPrice]
  );

  const coinBPrice = useCoinPrice(coinB?.id);
  const coinBFiatValue = useMemo(
    () =>
      coinBAmount && coinBPrice ? Number(coinBAmount) * coinBPrice : undefined,
    [coinBAmount, coinBPrice]
  );

  const insufficientCoinABalance = useMemo(
    () => new Decimal(coinABalance || "0").lt(coinAAmount || "0"),
    [coinAAmount, coinABalance]
  );

  const insufficientCoinBBalance = useMemo(
    () => new Decimal(coinBBalance || "0").lt(coinBAmount || "0"),
    [coinBAmount, coinBBalance]
  );

  const onCreate = async () => {
    if (!coinB) {
      return;
    }
    try {
      setIsCreating(true);
      const poolKey = await Exchange.createPool(coinB.id);

      setIsCreating(false);
      onNextStep(poolKey);
    } catch (error: any) {
      setIsCreating(false);

      addPopup("Error", PopupStatus.ERROR, error.message || "Unknown Error");
      console.log(error);
    }
  };

  return (
    <>
      <div className="fle flex-col">
        <div className="text-lg font-bold">Create Pool</div>
      </div>
      <CoinField
        coin={coinA}
        label="Bitcoin"
        autoFocus
        value={coinAAmount}
        fiatValue={coinAFiatValue}
        onUserInput={setCoinAAmount}
        className="border-border mt-4 px-3 pt-1 pb-2 !shadow-none bg-transparent"
      />
      <div className="flex items-center justify-center h-10 relative">
        <div className="size-7 bg-secondary rounded-full items-center justify-center flex relative z-10">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <div className="absolute inset-x-0 top-[50%] bg-border/60 h-[1px]" />
      </div>
      <CoinField
        coin={coinB}
        label="Rune"
        className="border-border px-3 pt-1 pb-2 !shadow-none bg-transparent"
        value={coinBAmount}
        fiatValue={coinBFiatValue}
        onSelectCoin={setCoinB}
        onUserInput={setCoinBAmount}
      />
      <div className="mt-6">
        {!address ? (
          <Button
            size="xl"
            className="w-full"
            onClick={() => updateConnectWalletModalOpen(true)}
          >
            Connect Wallet
          </Button>
        ) : (
          <Button
            size="xl"
            className="w-full"
            disabled={
              !coinB ||
              !Number(coinAAmount) ||
              !Number(coinBAmount) ||
              insufficientCoinABalance ||
              insufficientCoinBBalance ||
              isCreating
            }
            onClick={onCreate}
          >
            {isCreating && <Loader2 className="animate-spin" />}
            {!coinB
              ? "Select Rune"
              : !Number(coinAAmount)
              ? "Input BTC Amount"
              : !Number(coinBAmount)
              ? `Input ${getCoinSymbol(coinB)} Amount`
              : insufficientCoinABalance
              ? `Insufficient ${getCoinSymbol(coinA)} Balance`
              : insufficientCoinBBalance
              ? `Insufficient ${getCoinSymbol(coinB)} Balance`
              : "Create"}
          </Button>
        )}
      </div>
    </>
  );
}
