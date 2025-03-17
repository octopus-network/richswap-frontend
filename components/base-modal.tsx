import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

export function BaseModal({
  open,
  setOpen,
  title,
  children,
  className,
  showCloseButton,
}: PropsWithChildren<{
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  className?: string;
  showCloseButton?: boolean;
}>) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open && showCloseButton !== false) {
          setOpen(false);
        } else if (open) {
          setOpen(true);
        }
      }}
    >
      <DialogContent
        className={cn(
          "border-none bg-popover rounded-2xl p-0 gap-0 shadow-none",
          className
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        showCloseButton={showCloseButton}
      >
        {title ? (
          <DialogHeader className="p-5 pb-3">
            <DialogTitle className="text-left text-md text-muted-foreground">
              {title}
            </DialogTitle>
          </DialogHeader>
        ) : null}
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
