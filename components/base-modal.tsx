import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "border-none bg-popover rounded-2xl p-0 gap-0 shadow-none",
          className
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        showCloseButton={showCloseButton}
      >
        {title !== undefined ? (
          <DialogHeader className={title === "" ? "" : "p-5 pb-3"}>
            <DialogTitle className="text-left text-md text-muted-foreground">
              {title}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
        ) : null}
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
