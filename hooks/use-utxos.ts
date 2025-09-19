import { UnspentOutput } from "@/types";
import { useEffect, useMemo, useState } from "react";

import axios from "axios";

import useSWR from "swr";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { atom, useAtom } from "jotai";
import { Orchestrator } from "@/lib/orchestrator";

export const pendingBtcUtxosAtom = atom<UnspentOutput[]>([]);
export const pendingRuneUtxosAtom = atom<UnspentOutput[]>([]);

export function usePendingBtcUtxos() {
  return useAtom(pendingBtcUtxosAtom);
}

export function usePendingRuneUtxos() {
  return useAtom(pendingRuneUtxosAtom);
}

export function useBtcUtxos(address: string | undefined, pubkey?: string) {
  const [pendingUtxos] = usePendingBtcUtxos();

  const [filteredUtxos, setFilteredUtxos] = useState<UnspentOutput[]>();

  const { data: apiUtxos } = useSWR(
    address
      ? `/api/utxos/btc?address=${address}${pubkey ? `&pubkey=${pubkey}` : ""}`
      : undefined,
    (url: string) =>
      axios.get<{ data?: UnspentOutput[]; error: string }>(url).then((res) => {
        if (res.data.error) {
          throw new Error(res.data.error);
        }
        return res.data.data;
      }),
    { refreshInterval: 3 * 60 * 1000 }
  );

  useEffect(() => {
    if (!address || !apiUtxos) {
      return undefined;
    }
    const allUtxos = apiUtxos.concat(
      pendingUtxos.filter(
        (p) =>
          !p.runes.length &&
          apiUtxos.findIndex((c) => c.txid === p.txid && c.vout === p.vout) < 0
      )
    );

    Orchestrator.filterSpentUtxos(address, allUtxos).then(setFilteredUtxos);
  }, [apiUtxos, pendingUtxos, address]);

  return filteredUtxos;
}

export function useRuneUtxos(
  address: string | undefined,
  runeid?: string | undefined,
  pubkey?: string
) {
  const [pendingUtxos] = usePendingRuneUtxos();
  const [filteredUtxos, setFilteredUtxos] = useState<UnspentOutput[]>();

  const { data: apiUtxos } = useSWR(
    address && runeid && runeid !== "0:0"
      ? `/api/utxos/rune?address=${address}&runeid=${runeid}${
          pubkey ? `&pubkey=${pubkey}` : ""
        }`
      : undefined,
    (url: string) =>
      axios.get<{ data?: UnspentOutput[]; error: string }>(url).then((res) => {
        if (res.data.error) {
          throw new Error(res.data.error);
        }
        return res.data.data;
      }),
    { refreshInterval: 3 * 60 * 1000 }
  );

  useEffect(() => {
    if (!address || !apiUtxos) {
      return undefined;
    }
    const allUtxos = apiUtxos.concat(
      pendingUtxos.filter(
        (p) =>
          p.runes.length &&
          apiUtxos.findIndex((c) => c.txid === p.txid && c.vout === p.vout) < 0
      )
    );

    Orchestrator.filterSpentUtxos(address, allUtxos).then(setFilteredUtxos);
  }, [apiUtxos, pendingUtxos, address]);

  return filteredUtxos;
}

export function useWalletBtcUtxos() {
  const { paymentAddress, paymentPublicKey } = useLaserEyes();

  const paymentUtxos = useBtcUtxos(paymentAddress, paymentPublicKey);

  return useMemo(() => paymentUtxos, [paymentUtxos]);
}

export function useWalletRuneUtxos(runeid: string | undefined) {
  const { address, publicKey } = useLaserEyes();

  const utxos = useRuneUtxos(address, runeid, publicKey);

  return useMemo(() => utxos, [utxos]);
}
