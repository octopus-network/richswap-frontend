"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { LaserEyesProvider } from "@omnisat/lasereyes";
import { Topbar } from "./topbar";
import { Loader2 } from "lucide-react";

export function Providers({ children }: PropsWithChildren) {
  const [isMpunted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return !isMpunted ? (
    <div className="flex min-h-screen w-screen flex-col">
      <Topbar />
      <div className="flex flex-1 flex-col p-6 overflow-y-auto">
        <div className="flex items-center flex-col justify-center h-[30vh] md:pt-12">
          <Loader2 className="animate-spin size-16 text-muted-foreground" />
        </div>
      </div>
    </div>
  ) : (
    <LaserEyesProvider
      config={{
        network: "mainnet",
      }}
    >
      {children}
    </LaserEyesProvider>
  );
}
