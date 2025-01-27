import { createAction } from "@reduxjs/toolkit";

import { Coin } from "@/types";

export const addCoin = createAction<{
  coin: Coin;
}>("user/add-coin");
