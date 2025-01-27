"use client";

import { usePopups } from "@/store/popups";
import { motion } from "framer-motion";
import { PopupItem } from "./popup-item";

export function Popups() {
  const popups = usePopups();
  return (
    <div className="flex fixed flex-col-reverse auto-rows-auto gap-4 shadow-md left-4 bottom-12 max-w-[348px] w-full z-[999] transition-all ease-in-out duration-500">
      {popups.map((popup) => (
        <motion.div
          initial={{
            opacity: 0,
            transform: "translateY(10%)",
          }}
          animate={{
            opacity: 1,
            transform: "translateY(0%)",
          }}
          key={popup.id}
        >
          <PopupItem popup={popup} />
        </motion.div>
      ))}
    </div>
  );
}
