import { UNISAT, OKX, PHANTOM, XVERSE } from "@omnisat/lasereyes";

export const WALLETS: Record<
  string,
  {
    name: string;
    icon: string;
    url: string;
  }
> = {
  [UNISAT]: {
    name: "Unisat",
    icon: "/static/icons/unisat.png",
    url: "https://unisat.io/download",
  },
  [OKX]: {
    name: "OKX Wallet",
    icon: "/static/icons/okx.png",
    url: "https://www.okx.com",
  },
  [PHANTOM]: {
    name: "Phantom",
    icon: "/static/icons/phantom.png",
    url: "https://phantom.com",
  },
  [XVERSE]: {
    name: "Xverse",
    icon: "/static/icons/xverse.png",
    url: "https://www.xverse.app",
  },
};
