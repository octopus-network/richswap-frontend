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

export function useUtxos(address: string | undefined) {
  const pendingUtxos = usePendingUtxos(address);
  const spentUtxos = useAtomValue(spentUtxosAtom);
  const transactions = useTransactions();
  const { data: apiUtxos, mutate: mutateApiUtxos } = useSWR(
    address ? `/api/utxos?address=${address}` : undefined,
    (url: string) =>
      axios.get<{ data?: UnspentOutput[]; error: string }>(url).then((res) => {
        if (res.data.error) {
          throw new Error(res.data.error);
        }
        return res.data.data;
      }),
    { refreshInterval: 15 * 1000 }
  );

  useEffect(() => {
    mutateApiUtxos();
  }, [transactions, mutateApiUtxos]);

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
                  apiUtxos.findIndex(
                    (c) => c.txid === p.txid && c.vout === p.vout
                  ) < 0
              )
            )
        : undefined,
    [apiUtxos, pendingUtxos, spentUtxos]
  );
}

export function useWalletUtxos() {
  const { address, paymentAddress } = useLaserEyes();
  const utxos = useUtxos(address);
  const paymentUtxos = useUtxos(paymentAddress);

  return useMemo(
    () =>
      utxos && paymentUtxos
        ? paymentAddress !== address
          ? utxos.concat(paymentUtxos)
          : utxos
        : undefined,
    [utxos, paymentUtxos]
  );
}
