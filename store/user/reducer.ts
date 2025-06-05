import { UnknownAction, createReducer } from "@reduxjs/toolkit";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Coin } from "@/types";
import { addCoin, toggleKlineChart } from "./actions";

export interface UserState {
  coins: {
    [id: string]: Coin;
  };
  klineChartOpen: boolean;
}

export const initialState: UserState = {
  coins: {},
  klineChartOpen: true,
};

const reducer = createReducer<UserState>(initialState, (builder) =>
  builder
    .addCase(addCoin, (state, { payload: { coin } }) => {
      if (!state.coins) {
        state.coins = {};
      }
      state.coins[coin.id] = coin;
    })
    .addCase(toggleKlineChart, (state) => {
      state.klineChartOpen = !state.klineChartOpen;
    })
);

export const userStateStorageAtom = atomWithStorage(
  "user-state",
  initialState,
  undefined,
  {
    getOnInit: true,
  }
);

export const userStateAtom = atom(
  (get) => get(userStateStorageAtom),
  (get, set, action: UnknownAction) => {
    set(userStateStorageAtom, reducer(get(userStateStorageAtom), action));
  }
);
