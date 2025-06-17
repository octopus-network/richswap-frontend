"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { Nav } from "./nav";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { AccountButton } from "../account-button";
import { useSetAtom } from "jotai";
import { connectWalletModalOpenAtom } from "@/store/connect-wallet-modal-open";
import { Skeleton } from "../ui/skeleton";

import { MenuButton } from "./menu-button";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { LocaleSwitcher } from "./locale-switcher";

export function Topbar() {
  const { address, isInitializing } = useLaserEyes();
  const updateConnectWalletModalOpen = useSetAtom(connectWalletModalOpenAtom);

  const t = useTranslations("Topbar");

  return (
    <div className="flex justify-between items-cetner sm:px-4 px-3 py-2 border-b">
      <div className="items-center flex space-x-3 justify-start">
        <Image
          src="/static/logo.png"
          className="size-6"
          width={128}
          height={128}
          alt="RichSwap"
        />
        <span className="font-bold">RichSwap</span>
      </div>
      <div className="flex-none hidden ml-4">
        <Nav />
      </div>
      <div className="flex-1 justify-end space-x-4 items-center hidden">
        <div className="hidden md:block">
          <LocaleSwitcher />
        </div>
        {isInitializing ? (
          <Skeleton className="h-9 w-24 rounded-lg" />
        ) : !address ? (
          <Button
            variant="accent"
            className="rounded-lg"
            onClick={() => updateConnectWalletModalOpen(true)}
          >
            {t("connectWallet")}
          </Button>
        ) : (
          <AccountButton />
        )}
        <MenuButton />
      </div>
      <Link
        href="https://oc.app/community/o5uz6-dqaaa-aaaar-bhnia-cai/channel/1529837122"
        target="_blank"
      >
        <Button
          variant="outline"
          className="rounded-full"
        >
          Support
        </Button>
      </Link>
    </div>
  );
}
