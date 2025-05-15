"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import type { MouseEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FaXTwitter } from "react-icons/fa6";

import {
  ArrowLeftRight,
  Waves,
  Ellipsis,
  BookOpen,
  MessageSquare,
  Package,
  Code,
  Globe,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { RUNESCAN_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

type NavItem = {
  title: string;
  href: string;
  icon: ReactNode;
};

export const navItems: NavItem[] = [
  {
    title: "swap",
    href: "/swap",
    icon: <ArrowLeftRight className="size-4" />,
  },
  {
    title: "pools",
    href: "/pools",
    icon: <Waves className="size-4" />,
  },
  {
    title: "portfolio",
    href: "/portfolio",
    icon: <Package className="size-4" />,
  },
];

export const Nav = () => {
  const [tabBoundingBox, setTabBoundingBox] = useState<DOMRect>();
  const [wrapperBoundingBox, setWrapperBoundingBox] = useState<DOMRect>();
  const [highlightTab, setHighlightTab] = useState(false);

  const [isHoveredFromNull, setIsHoveredFromNull] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("Topbar");

  const pathname = usePathname();
  const activeNavIdx = navItems.findIndex(
    (r) => r.href === "/" + pathname?.split("/")[1]
  );

  const repositionHighlight = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!wrapperRef.current) {
      return;
    }
    setTabBoundingBox(e.currentTarget.getBoundingClientRect());
    setWrapperBoundingBox(wrapperRef.current.getBoundingClientRect());
    setIsHoveredFromNull(!highlightTab);
    setHighlightTab(true);
  };

  const highlightStyles = useMemo(
    () =>
      tabBoundingBox && wrapperBoundingBox
        ? {
            transitionDuration: isHoveredFromNull ? "0s" : "0.15s",
            opacity: highlightTab ? 1 : 0,
            width: `${tabBoundingBox.width}px`,
            transform: `translate(${
              tabBoundingBox.left - wrapperBoundingBox.left
            }px)`,
          }
        : undefined,
    [isHoveredFromNull, highlightTab, tabBoundingBox, wrapperBoundingBox]
  );

  return (
    <nav
      ref={wrapperRef}
      className="hidden md:flex items-center justify-center relative font-medium space-x-3 text-sm"
      onMouseLeave={() => setHighlightTab(false)}
    >
      <div
        className="bg-card absolute top-[2px] left-0 h-[32px] rounded-lg transition-all duration-150 ease"
        ref={highlightRef}
        style={highlightStyles}
      />
      {navItems.map((item, idx) => (
        <Link
          key={idx}
          href={item.href}
          onMouseOver={(ev) => repositionHighlight(ev)}
          className={cn(
            "flex items-center bg-transparent px-[15px] h-[32px] rounded-lg leading-[32px] cursor-pointer hover:text-gray-1000 transition-colors duration-200 relative",
            activeNavIdx === idx ? "text-primary bg-card" : "text-foreground"
          )}
        >
          {item.icon}
          <span className="ml-2">{t(item.title)}</span>
        </Link>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <a
            onMouseOver={(ev) => repositionHighlight(ev)}
            className="flex items-center bg-transparent  px-[15px] h-[32px] rounded-lg leading-[32px] cursor-pointer hover:text-gray-1000 transition-colors duration-200 relative"
          >
            <Ellipsis className="size-4" />
            <span className="ml-2">{t("more")}</span>
          </a>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[180px] border-none shadow-none text-foreground">
          <Link href={`${RUNESCAN_URL}/exchange/RICH_SWAP`} target="_blank">
            <DropdownMenuItem>
              <Globe />
              <span className="ml-2 mr-1">{t("explorer")}</span>
            </DropdownMenuItem>
          </Link>
          <Link href="https://x.com/RichSwap_REE" target="_blank">
            <DropdownMenuItem>
              <FaXTwitter /> <span className="ml-2 mr-1">{t("twitter")}</span>{" "}
            </DropdownMenuItem>
          </Link>
          <Link
            href="https://omnitynetwork.notion.site/richswap"
            target="_blank"
          >
            <DropdownMenuItem>
              <BookOpen />
              <span className="ml-2 mr-1">{t("faq")}</span>
            </DropdownMenuItem>
          </Link>
          <Link
            href="https://oc.app/community/o5uz6-dqaaa-aaaar-bhnia-cai/channel/1529837122/?ref=g6b5s-jqaaa-aaaar-bfbjq-cai"
            target="_blank"
          >
            <DropdownMenuItem>
              <MessageSquare />
              <span className="ml-2 mr-1">{t("support")}</span>
            </DropdownMenuItem>
          </Link>
          <Link
            href="https://github.com/octopus-network/richswap-canister"
            target="_blank"
          >
            <DropdownMenuItem>
              <Code />
              <span className="ml-2 mr-1">{t("sourceCode")}</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};
