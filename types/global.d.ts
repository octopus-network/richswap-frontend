declare global {
  interface Window {
    okxwallet: {
      bitcoin: {
        signPsbt: (
          psbtHex: string,
          config?: {
            toSignInputs: {
              index: number;
              publicKey: string;
            }[];
          }
        ) => string;
      };
    };
  }
}
