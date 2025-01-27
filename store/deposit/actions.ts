import { createAction } from "@reduxjs/toolkit";
import { Field } from "@/types";

export const typeInput = createAction<{
  field: Field;
  typedValue: string;
}>("deposit/type-input");
