import { BaseModal } from "../base-modal";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Coin, PoolInfo } from "@/types";
import { BITCOIN } from "@/lib/constants";
import { CreateForm } from "./create-form";
import { DepositReview } from "../deposit-review";
import { ManageLiquidityModal } from "../manage-liquidity-modal";

export function CreatePoolModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [coinA] = useState<Coin>(BITCOIN);
  const [coinB, setCoinB] = useState<Coin | null>(null);
  const [coinAAmount, setCoinAAmount] = useState("");
  const [coinBAmount, setCoinBAmount] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [pool, setPool] = useState<PoolInfo>();
  const [showReview, setShowReview] = useState(false);
  const [nonce, setNonce] = useState(BigInt(0));
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowReview(false);
      setShowDepositModal(false);
    }
  }, [open]);

  const onNextStep = (address: string, nonce = BigInt(0)) => {
    setPoolAddress(address);
    setShowReview(true);
    setNonce(nonce);
  };

  const onPoolExists = (pool: PoolInfo) => {
    setPool(pool);
    setShowDepositModal(true);
  };

  const onBack = () => {
    setShowReview(false);
  };

  return (
    <>
      <BaseModal open={open} setOpen={setOpen} showCloseButton={!showReview}>
        <div className="p-5">
          {showReview ? (
            <motion.div
              initial={{
                transform: "translateX(20px)",
              }}
              animate={{
                transform: "translateX(0)",
              }}
            >
              <DepositReview
                coinA={coinA}
                coinB={coinB}
                poolAddress={poolAddress}
                poolUtxos={[]}
                coinAAmount={coinAAmount}
                coinBAmount={coinBAmount}
                onBack={onBack}
                nonce={nonce.toString()}
                onSuccess={() => setOpen(false)}
              />
            </motion.div>
          ) : (
            <CreateForm
              coinA={coinA}
              coinB={coinB}
              coinAAmount={coinAAmount}
              coinBAmount={coinBAmount}
              setCoinB={setCoinB}
              setCoinAAmount={setCoinAAmount}
              setCoinBAmount={setCoinBAmount}
              onNextStep={onNextStep}
              onPoolExsists={onPoolExists}
            />
          )}
        </div>
      </BaseModal>
      {pool && (
        <ManageLiquidityModal
          poolAddress={pool.address}
          position={null}
          open={showDepositModal}
          setOpen={(open) => {
            setShowDepositModal(open);
            if (!open) {
              setOpen(false);
            }
          }}
        />
      )}
    </>
  );
}
