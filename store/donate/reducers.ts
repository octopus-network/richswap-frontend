import { createReducer } from "@reduxjs/toolkit";
import { atomWithReducer } from "jotai/utils";

import { typeInput } from "./actions";

interface DonateState {
  typedValue: string;
}

const initialState: DonateState = {
  typedValue: "",
};

const reducer = createReducer<DonateState>(initialState, (builder) =>
  builder.addCase(typeInput, (state, { payload: { typedValue } }) => {
    return {
      typedValue,
    };
  })
);

export const donateStateAtom = atomWithReducer(initialState, reducer);
