export interface Coin {
  id: string;
  icon?: string;
  symbol?: string;
  name: string;
  runeId?: string;
  runeSymbol?: string;
  decimals: number;
}

export enum Field {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
}
