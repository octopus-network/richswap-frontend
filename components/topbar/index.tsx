"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { Nav } from "./nav";
import { useLaserEyes } from "@omnisat/lasereyes";
import { AccountButton } from "../account-button";
import { useSetAtom } from "jotai";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import { MenuButton } from "./menu-button";

export function Topbar() {
  const { address, isInitializing } = useLaserEyes();
  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isInitializing) {
      setInitialized(true);
    }
  }, [isInitializing]);

  return (
    <div className="flex justify-between items-cetner sm:p-4 p-3">
      <div className="items-center flex space-x-3 flex-1 justify-start">
        <Image
          src="/static/logo.png"
          className="size-6 sm:size-8"
          width={128}
          height={128}
          alt="RichSwap"
        />
        <span className="font-bold sm:text-lg">RichSwap</span>
      </div>
      <div className="flex-none hidden md:flex">
        <Nav />
      </div>
      <div className="flex-1 justify-end space-x-2 flex">
        {!initialized ? (
          <Skeleton className="h-9 w-24 rounded-full" />
        ) : !address ? (
          <Button
            variant="accent"
            className="rounded-full"
            onClick={() => updateConnectWalletModalOpen(true)}
          >
            Connect wallet
          </Button>
        ) : (
          <AccountButton />
        )}
        <MenuButton />
      </div>
    </div>
  );
}
