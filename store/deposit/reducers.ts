import { createReducer } from "@reduxjs/toolkit";
import { atomWithReducer } from "jotai/utils";
import { Field } from "@/types";

import { typeInput } from "./actions";

interface DepositState {
  independentField: Field;
  typedValue: string;
}

const initialState: DepositState = {
  independentField: Field.INPUT,
  typedValue: "",
};

const reducer = createReducer<DepositState>(initialState, (builder) =>
  builder.addCase(typeInput, (state, { payload: { field, typedValue } }) => {
    return {
      ...state,
      independentField: field,
      typedValue,
    };
  })
);

export const depositStateAtom = atomWithReducer(initialState, reducer);
