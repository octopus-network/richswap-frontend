"use client";

import { useState } from "react";
import { CreatePoolModal } from "@/components/create-pool-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

export function CreateButton() {
  const [createPoolModalOpen, setCreatePoolModalOpen] = useState(false);

  const t = useTranslations("Pools");
  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => setCreatePoolModalOpen(true)}
      >
        <Plus className="size-4" />
        {t("createPool")}
      </Button>
      <CreatePoolModal
        open={createPoolModalOpen}
        setOpen={setCreatePoolModalOpen}
      />
    </>
  );
}
