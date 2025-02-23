import { UnspentOutput } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { getUtxoByOutpoint } from "@/lib/utils";
import { Orchestrator } from "@/lib/orchestrator";
import { useAtomValue } from "jotai";
import { spentUtxosAtom } from "@/store/spent-utxos";
import axios from "axios";
import { useTransactions } from "@/store/transactions";
import useSWR from "swr";
import { useLaserEyes } from "@omnisat/lasereyes";

export function usePendingUtxos(address: string | undefined) {
  const [utxos, setUtxos] = useState<UnspentOutput[]>([]);

  const [timer, setTimer] = useState<number>();
  const transactions = useTransactions();

  useEffect(() => {
    if (!address) {
      return;
    }
    Orchestrator.getUnconfirmedOutpoints(address)
      .then((outpoints: string[]) =>
        Promise.all(
          outpoints.map((outpoint) => {
            const [txid, vout] = outpoint.split(":");
            return getUtxoByOutpoint(txid, Number(vout));
          })
        )
      )
      .then((utxos) => {
        const filteredUtxos = utxos.filter((utxo) => !!utxo);
        setUtxos(filteredUtxos);
      });
  }, [address, timer, transactions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Date.now());
    }, 15 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return utxos;
}

export function useBtcUtxos(address: string | undefined, pubkey?: string) {
  const pendingUtxos = usePendingUtxos(address);
  const spentUtxos = useAtomValue(spentUtxosAtom);
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
    { refreshInterval: 15 * 1000 }
  );

  return useMemo(
    () =>
      apiUtxos
        ? apiUtxos
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
                  apiUtxos.findIndex(
                    (c) => c.txid === p.txid && c.vout === p.vout
                  ) < 0
              )
            )
        : undefined,
    [apiUtxos, pendingUtxos, spentUtxos]
  );
}

export function useRuneUtxos(
  address: string | undefined,
  runeid?: string | undefined,
  pubkey?: string
) {
  const pendingUtxos = usePendingUtxos(address);
  const spentUtxos = useAtomValue(spentUtxosAtom);
  const { data: apiUtxos } = useSWR(
    address && runeid
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
    { refreshInterval: 15 * 1000 }
  );

  return useMemo(
    () =>
      apiUtxos
        ? apiUtxos
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
                  apiUtxos.findIndex(
                    (c) => c.txid === p.txid && c.vout === p.vout
                  ) < 0
              )
            )
        : undefined,
    [apiUtxos, pendingUtxos, spentUtxos]
  );
}

export function useWalletBtcUtxos() {
  const { address, paymentAddress, publicKey, paymentPublicKey } =
    useLaserEyes();

  const utxos = useBtcUtxos(address, publicKey);
  const paymentUtxos = useBtcUtxos(
    paymentAddress !== address ? paymentAddress : undefined,
    paymentPublicKey
  );

  return useMemo(
    () =>
      utxos
        ? paymentAddress !== address
          ? paymentUtxos
            ? utxos.concat(paymentUtxos)
            : undefined
          : utxos
        : undefined,
    [utxos, paymentUtxos, address, paymentAddress]
  );
}

export function useWalletRuneUtxos(runeid: string | undefined) {
  const { address, paymentAddress, publicKey, paymentPublicKey } =
    useLaserEyes();

  const utxos = useRuneUtxos(address, runeid, publicKey);
  const paymentUtxos = useRuneUtxos(
    paymentAddress !== address ? paymentAddress : undefined,
    runeid,
    paymentPublicKey
  );

  return useMemo(
    () =>
      utxos
        ? paymentAddress !== address
          ? paymentUtxos
            ? utxos.concat(paymentUtxos)
            : undefined
          : utxos
        : undefined,
    [utxos, paymentUtxos, address, paymentAddress]
  );
}
