import { Popup, PopupStatus } from "@/store/popups";
import { useCallback, useEffect } from "react";
import { useRemovePopup } from "@/store/popups";
import { Info, Loader2, TriangleAlert, Check } from "lucide-react";

import { useSpring, animated } from "@react-spring/web";

export function PopupItem({ popup }: { popup: Popup }) {
  const removePopup = useRemovePopup();

  const [progressBarProps, progressBarApi] = useSpring(
    () => ({
      width: "100%",
    }),
    []
  );

  useEffect(() => {
    if (popup.status !== PopupStatus.LOADING) {
      progressBarApi.start({
        width: "0%",
        config: { duration: popup.status === PopupStatus.INFO ? 2000 : 4000 },
        onRest() {
          removePopup(popup.id);
        },
      });
    }
  }, [popup, progressBarApi, removePopup]);

  const handleMouseOver = useCallback(() => {
    progressBarApi.pause();
  }, [progressBarApi]);

  const handleMouseLeave = useCallback(() => {
    progressBarApi.resume();
  }, [progressBarApi]);

  return (
    <div
      className="rounded-lg bg-black/80 p-3 items-center flex relative z-[998] overflow-hidden cursor-pointer"
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseLeave}
    >
      {popup.status !== PopupStatus.LOADING &&
      popup.status !== PopupStatus.INFO ? (
        <div className="absolute top-0 left-0 h-[2px] bg-secondary w-full">
          <animated.div
            className="absolute top-0 left-0 h-[2px] bg-primary/80"
            style={progressBarProps}
          />
        </div>
      ) : null}
      <div className="size-10 flex items-center justify-center">
        {popup.status === PopupStatus.LOADING ? (
          <Loader2 className="size-8 animate-spin text-orange-400" />
        ) : popup.status === PopupStatus.SUCCESS ? (
          <Check className="size-8 text-green-500" />
        ) : popup.status === PopupStatus.ERROR ? (
          <TriangleAlert className="size-8 text-red-500" />
        ) : (
          <Info className="size-8 text-sky-500" />
        )}
      </div>
      <div className="flex flex-col ml-3">
        <span className="font-semibold">{popup.title}</span>
        {popup.description && (
          <span className="text-muted-foreground text-sm mt-1">
            {popup.description}
          </span>
        )}
      </div>
    </div>
  );
}
