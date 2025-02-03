"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import type { MouseEvent, ReactNode } from "react";
import { ArrowLeftRight, Waves } from "lucide-react";

import { cn } from "@/lib/utils";
import Link from "next/link";

type NavItem = {
  title: string;
  href: string;
  icon: ReactNode;
};

export const navItems: NavItem[] = [
  {
    title: "Swap",
    href: "/swap",
    icon: <ArrowLeftRight className="size-4" />,
  },
  {
    title: "Pools",
    href: "/pools",
    icon: <Waves className="size-4" />,
  },
];

export const Nav = () => {
  const [tabBoundingBox, setTabBoundingBox] = useState<DOMRect>();
  const [wrapperBoundingBox, setWrapperBoundingBox] = useState<DOMRect>();
  const [highlightedTab, setHighlightedTab] = useState<NavItem>();

  const [isHoveredFromNull, setIsHoveredFromNull] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const activeNavIdx = navItems.findIndex(
    (r) => r.href === "/" + pathname?.split("/")[1]
  );

  const repositionHighlight = (
    e: MouseEvent<HTMLAnchorElement>,
    tab: NavItem
  ) => {
    if (!wrapperRef.current) {
      return;
    }
    setTabBoundingBox(e.currentTarget.getBoundingClientRect());
    setWrapperBoundingBox(wrapperRef.current.getBoundingClientRect());
    setIsHoveredFromNull(!highlightedTab);
    setHighlightedTab(tab);
  };

  const highlightStyles = useMemo(
    () =>
      tabBoundingBox && wrapperBoundingBox
        ? {
            transitionDuration: isHoveredFromNull ? "0s" : "0.15s",
            opacity: highlightedTab ? 1 : 0,
            width: `${tabBoundingBox.width}px`,
            transform: `translate(${
              tabBoundingBox.left - wrapperBoundingBox.left
            }px)`,
          }
        : undefined,
    [isHoveredFromNull, highlightedTab, tabBoundingBox, wrapperBoundingBox]
  );

  return (
    <nav
      ref={wrapperRef}
      className="hidden md:flex items-center justify-center relative font-semibold space-x-4"
      onMouseLeave={() => setHighlightedTab(undefined)}
    >
      <div
        className="bg-card absolute top-0 left-0 h-[34px] rounded-lg transition-all duration-150 ease"
        ref={highlightRef}
        style={highlightStyles}
      />
      {navItems.map((item, idx) => (
        <Link
          key={idx}
          href={item.href}
          onMouseOver={(ev) => repositionHighlight(ev, item)}
          className={cn(
            "flex items-center bg-transparent px-[16px] h-[34px] rounded-lg leading-[34px] cursor-pointer hover:text-gray-1000 transition-colors duration-200 relative",
            activeNavIdx === idx ? "text-primary bg-card" : "text-foreground"
          )}
        >
          {item.icon}
          <span className="ml-2">{item.title}</span>
        </Link>
      ))}
    </nav>
  );
};
