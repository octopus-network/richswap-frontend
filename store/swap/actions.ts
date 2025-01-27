import { createAction } from "@reduxjs/toolkit";
import { Coin, Field } from "@/types";

export const selectCoin = createAction<{
  field: Field;
  coin: Coin;
}>("/swap/select-coin");

export const updateCoins = createAction<{
  coinA: Coin | null;
  coinB: Coin | null;
}>("/swap/update-coins");

export const switchCoins = createAction("/swap/switch-coins");

export const typeInput = createAction<{
  field: Field;
  typedValue: string;
}>("swap/type-input");
