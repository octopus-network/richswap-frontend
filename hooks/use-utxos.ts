import { UnspentOutput } from "@/types";
import { useMemo } from "react";

import { useAtomValue } from "jotai";
import { spentUtxosAtom } from "@/store/spent-utxos";

import { atom, useAtom } from "jotai";

const pendingBtcUtxosAtom = atom<UnspentOutput[]>([]);
const pendingRuneUtxosAtom = atom<UnspentOutput[]>([]);
const confirmedRuneUtxosAtom = atom<UnspentOutput[]>();
const confirmedBtcUtxosAtom = atom<UnspentOutput[]>();

export function usePendingBtcUtxos() {
  return useAtom(pendingBtcUtxosAtom);
}

export function usePendingRuneUtxos() {
  return useAtom(pendingRuneUtxosAtom);
}

export function useConfirmedBtcUtxos() {
  return useAtom(confirmedBtcUtxosAtom);
}

export function useConfirmedRuneUtxos() {
  return useAtom(confirmedRuneUtxosAtom);
}

export function useBtcUtxos() {
  const [pendingUtxos] = usePendingBtcUtxos();
  const [confirmedUtxos] = useConfirmedBtcUtxos();
  const spentUtxos = useAtomValue(spentUtxosAtom);

  return useMemo(
    () =>
      confirmedUtxos
        ? confirmedUtxos
            .filter(
              (c) =>
                spentUtxos.findIndex(
                  (s) => s.txid === c.txid && s.vout === c.vout
                ) < 0
            )
            .concat(
              pendingUtxos.filter(
                (p) =>
                  !p.runes.length &&
                  confirmedUtxos.findIndex(
                    (c) => c.txid === p.txid && c.vout === p.vout
                  ) < 0
              )
            )
        : undefined,
    [confirmedUtxos, pendingUtxos, spentUtxos]
  );
}

export function useRuneUtxos() {
  const [pendingUtxos] = usePendingRuneUtxos();
  const [confirmedUtxos] = useConfirmedRuneUtxos();
  const spentUtxos = useAtomValue(spentUtxosAtom);

  return useMemo(
    () =>
      confirmedUtxos
        ? confirmedUtxos
            .filter(
              (c) =>
                spentUtxos.findIndex(
                  (s) => s.txid === c.txid && s.vout === c.vout
                ) < 0
            )
            .concat(
              pendingUtxos.filter(
                (p) =>
                  p.runes.length &&
                  confirmedUtxos.findIndex(
                    (c) => c.txid === p.txid && c.vout === p.vout
                  ) < 0
              )
            )
        : undefined,
    [confirmedUtxos, pendingUtxos, spentUtxos]
  );
}

export function useWalletBtcUtxos() {
  const paymentUtxos = useBtcUtxos();

  return useMemo(() => paymentUtxos, [paymentUtxos]);
}

export function useWalletRuneUtxos(runeid: string | undefined) {
  const utxos = useRuneUtxos();

  return useMemo(
    () => utxos?.filter((utxo) => utxo.runes[0].id === runeid),
    [utxos, runeid]
  );
}
