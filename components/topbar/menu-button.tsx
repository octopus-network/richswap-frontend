import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { AlignJustify, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { navItems } from "./nav";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import axios from "axios";
import { RiGlobalLine } from "react-icons/ri";

export function MenuButton() {
  const t = useTranslations("Topbar");
  const pathname = usePathname();
  const router = useRouter();

  const activeNavIdx = navItems.findIndex(
    (r) => r.href === "/" + pathname?.split("/")[1]
  );

  const onSetLocale = async (locale: string) => {
    await axios.post("/api/app/set-locale", { locale });
    router.refresh();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="inline-flex md:hidden rounded-full shrink-0"
        >
          <AlignJustify className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-5/6 xs:w-[320px] p-0 right-0 top-0">
        <div className="mt-12 border-t">
          {navItems.map((nav, idx) => (
            <SheetClose asChild key={idx}>
              <Link
                href={nav.href}
                className={cn(
                  "flex justify-between items-center px-4 py-3 font-medium border-b odd:bg-secondary/20",
                  activeNavIdx === idx ? "text-primary" : "text-foreground"
                )}
              >
                <div className="flex items-center">
                  {nav.icon}
                  <span className="ml-3">{t(nav.title)}</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </SheetClose>
          ))}
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" className="border-b">
              <AccordionTrigger className="text-md group px-4 py-3 hover:no-underline outline-none ring-0 font-medium">
                <div className="flex items-center">
                  <RiGlobalLine className="size-4" />
                  <span className="ml-3">{t("language")}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col pb-0">
                <SheetClose asChild>
                  <div
                    onClick={() => onSetLocale("en")}
                    className={cn(
                      "flex justify-between items-center px-4 py-3 font-medium border-t pl-11"
                    )}
                  >
                    <span>English</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </SheetClose>
                <SheetClose asChild>
                  <div
                    onClick={() => onSetLocale("zh")}
                    className={cn(
                      "flex justify-between items-center px-4 py-3 font-medium border-t pl-11"
                    )}
                  >
                    <span>中文</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </SheetClose>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
