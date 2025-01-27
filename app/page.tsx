"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/swap");
  }, []);
  return (
    <div className="flex items-center flex-col justify-center h-[30vh] md:pt-12">
      <Loader2 className="animate-spin size-16 text-muted-foreground" />
    </div>
  );
}
