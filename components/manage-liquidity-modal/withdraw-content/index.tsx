import { useEffect, useState } from "react";
import { Coin } from "@/types";
import { BITCOIN } from "@/lib/constants";
import { WithdrawForm } from "./withdraw-form";
import { WithdrawReview } from "./withdraw-review";
import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";

export function WithdrawContent() {
  const [coinA] = useState<Coin>(BITCOIN);
  const [coinB, setCoinB] = useState<Coin | null>(null);
  const [coinAAmount, setCoinAAmount] = useState("");
  const [coinBAmount, setCoinBAmount] = useState("");
  const [poolKey, setPoolKey] = useState("");

  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowReview(false);
    }
  }, [open]);

  const onNextStep = (key: string) => {
    setPoolKey(key);
    setShowReview(true);
  };

  const onBack = () => {
    setShowReview(false);
  };

  return (
    <TabsContent value="withdraw">
      <motion.div
        initial={{
          transform: "translateX(20px)",
        }}
        animate={{
          transform: "translateX(0)",
        }}
      >
        {showReview ? <WithdrawReview /> : <WithdrawForm />}
      </motion.div>
    </TabsContent>
  );
}
