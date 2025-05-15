"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import axios from "axios";

export function LocaleSwitcher() {
  const t = useTranslations("Application");
  const router = useRouter();
  const [_, setIsSwitching] = useState(false);

  const onSetLocale = async (locale: string) => {
    setIsSwitching(true);
    await axios.post("/api/app/set-locale", { locale });
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <a className="flex text-sm items-center bg-transparent leading-[32px] cursor-pointer">
          <span>{t("locale")}</span>
          <ChevronDown className="ml-1 text-muted-foreground size-4" />
        </a>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[100px] border-none shadow-none text-foreground">
        <DropdownMenuItem onClick={() => onSetLocale("en")} className="justify-center">
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSetLocale("zh")} className="justify-center">
          中文
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
