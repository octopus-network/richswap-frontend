import { useEffect, useState } from "react";
import { Coin, PoolInfo } from "@/types";

import { DepositForm } from "./deposit-form";
import { DepositReview } from "@/components/deposit-review";
import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";

export function DepositContent({
  pool,
  onSuccess,
  setOnReview,
}: {
  pool: PoolInfo;
  setOnReview: (onReview: boolean) => void;
  onSuccess: () => void;
}) {
  const [coinA] = useState<Coin>(pool.coinA);
  const [coinB] = useState<Coin>(pool.coinB);
  const [coinAAmount, setCoinAAmount] = useState("");
  const [coinBAmount, setCoinBAmount] = useState("");
  const [nonce, setNonce] = useState("0");

  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowReview(false);
    }
  }, [open]);

  const onReview = (
    coinAAmount: string,
    coinBAmount: string,
    nonce: string
  ) => {
    setCoinAAmount(coinAAmount);
    setCoinBAmount(coinBAmount);
    setNonce(nonce);
    setShowReview(true);
    setOnReview(true);
  };

  const onBack = () => {
    setShowReview(false);
    setOnReview(false);
  };

  return (
    <TabsContent value="deposit">
      <motion.div
        initial={{
          transform: "translateX(20px)",
        }}
        animate={{
          transform: "translateX(0)",
        }}
      >
        {showReview ? (
          <>
            <DepositReview
              coinA={coinA}
              coinB={coinB}
              poolKey={pool.key}
              coinAAmount={coinAAmount}
              coinBAmount={coinBAmount}
              onSuccess={onSuccess}
              showCancelButton
              nonce={nonce}
              onBack={onBack}
            />
          </>
        ) : (
          <DepositForm pool={pool} onReview={onReview} />
        )}
      </motion.div>
    </TabsContent>
  );
}
