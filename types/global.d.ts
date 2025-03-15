import { ToSignInput } from "./transaction";

declare global {
  interface Window {
    eruda: any;
    okxwallet: {
      bitcoin: {
        signPsbt: (
          psbtHex: string,
          config?: {
            autoFinalized?: boolean;
            toSignInputs: ToSignInput[];
          }
        ) => Promise<string>;
      };
    };
  }
}
