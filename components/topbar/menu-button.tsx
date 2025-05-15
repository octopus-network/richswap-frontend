import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { AlignJustify } from "lucide-react";
import { Button } from "../ui/button";
import { navItems } from "./nav";

export function MenuButton() {
  const t = useTranslations("Topbar");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="inline-flex md:hidden rounded-full shrink-0"
        >
          <AlignJustify className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        {navItems.map((nav, idx) => (
          <Link href={nav.href} key={idx}>
            <DropdownMenuItem className="text-foreground flex">
              <div className="flex space-x-2 items-center">
                {nav.icon}
                <span>{t(nav.title)}</span>
              </div>
            </DropdownMenuItem>
          </Link>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
