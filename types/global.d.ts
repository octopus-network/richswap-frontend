import { ToSignInput } from "./transaction";

declare global {
  interface Window {
    okxwallet: {
      bitcoin: {
        signPsbt: (
          psbtHex: string,
          config?: {
            autoFinalized?: boolean;
            toSignInputs: ToSignInput[];
          }
        ) => Promise<string>;

        signMessage: (
          message: string,
          type?: "ecdsa" | "bip322-simple"
        ) => Promise<string>;
      };
    };
  }
}
