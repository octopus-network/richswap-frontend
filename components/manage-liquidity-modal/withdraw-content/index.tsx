import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";

export function WithdrawContent() {
  return (
    <TabsContent value="withdraw">
      <motion.div
        initial={{
          transform: "translateX(20px)",
        }}
        animate={{
          transform: "translateX(0)",
        }}
      >
        withdraw
      </motion.div>
    </TabsContent>
  );
}
