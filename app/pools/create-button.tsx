"use client";

import { useState } from "react";
import { CreatePoolModal } from "@/components/create-pool-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreateButton() {
  const [createPoolModalOpen, setCreatePoolModalOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="lg" onClick={() => setCreatePoolModalOpen(true)}>
        <Plus className="size-4" />
        Create Pool
      </Button>
      <CreatePoolModal
        open={createPoolModalOpen}
        setOpen={setCreatePoolModalOpen}
      />
    </>
  );
}
