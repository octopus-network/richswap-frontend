import { createReducer } from "@reduxjs/toolkit";
import { atomWithReducer } from "jotai/utils";
import { Coin, Field } from "@/types";

import { selectCoin, switchCoins, typeInput, updateCoins } from "./actions";

interface SwapState {
  independentField: Field;
  typedValue: string;
  [Field.INPUT]: {
    coin: Coin | null;
  };
  [Field.OUTPUT]: {
    coin: Coin | null;
  };
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: "",
  [Field.INPUT]: {
    coin: null,
  },
  [Field.OUTPUT]: {
    coin: null,
  },
};

const reducer = createReducer<SwapState>(initialState, (builder) =>
  builder
    .addCase(selectCoin, (state, { payload: { field, coin } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;

      if (coin.id === state[otherField].coin?.id) {
        return {
          ...state,
          independentFieldType:
            state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { coin },
          [otherField]: { coin: state[field].coin },
        };
      } else {
        return {
          ...state,
          [field]: { coin },
        };
      }
    })
    .addCase(updateCoins, (state, { payload: { coinA, coinB } }) => {
      return {
        ...state,
        [Field.INPUT]: { coin: coinA },
        [Field.OUTPUT]: { coin: coinB },
      };
    })
    .addCase(switchCoins, (state) => {
      return {
        ...state,
        independentField:
          state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { coin: state[Field.OUTPUT].coin },
        [Field.OUTPUT]: { coin: state[Field.INPUT].coin },
      };
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      };
    })
);

export const swapStateAtom = atomWithReducer(initialState, reducer);
