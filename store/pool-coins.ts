import { Coin } from "@/types";

import { atomWithStorage } from "jotai/utils";

export const poolCoinsAtom = atomWithStorage<Coin[]>("pool-coins", []);
