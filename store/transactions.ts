import { produce } from "immer";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { TransactionInfo, TransactionStatus } from "@/types";
import { useMemo } from "react";

export const transactionsAtom = atomWithStorage<TransactionInfo[]>(
  "transactions",
  []
);

export const addTransactionAtom = atom(
  null,
  (get, set, initialTransaction: Omit<TransactionInfo, "timestamp">) => {
    const prev = get(transactionsAtom);
    const timestamp = new Date().getTime();

    const transaction: TransactionInfo = {
      ...initialTransaction,
      timestamp,
    };
    const next = produce(prev, (draft) => {
      draft.push(transaction);
      return draft;
    });
    set(transactionsAtom, next);
    return transaction;
  }
);

export const removeTransactionAtom = atom(null, (get, set, txid: string) => {
  const prev = get(transactionsAtom);

  const next = produce(prev, (draft) => {
    draft = draft.filter((item) => item.txid !== txid);
    return draft;
  });
  set(transactionsAtom, next);
});

export const updateTransactionStatusAtom = atom(
  null,
  (
    get,
    set,
    {
      txid,
      status,
      message,
      blockHeight,
    }: {
      txid: string;
      status: TransactionStatus;
      message?: string;
      blockHeight?: number;
    }
  ) => {
    const prev = get(transactionsAtom);
    const next = produce(prev, (draft) => {
      const transaction = draft.find((tx) => tx.txid === txid);
      if (transaction) {
        transaction.status = status;
        transaction.message = message;
        transaction.blockHeight = blockHeight;
      }
    });
    set(transactionsAtom, next);
  }
);

export function useAddTransaction() {
  return useSetAtom(addTransactionAtom);
}

export function useRemoveTransaction() {
  return useSetAtom(removeTransactionAtom);
}

export function useUpdateTransactionStatus() {
  return useSetAtom(updateTransactionStatusAtom);
}

export function useTransactions() {
  const transactions = useAtomValue(transactionsAtom);
  return transactions;
}

export function usePendingTransactions() {
  const pendingTransactions = useTransactions();

  return useMemo(
    () =>
      pendingTransactions.filter(
        (tx) => tx.status === TransactionStatus.BROADCASTED
      ),
    [pendingTransactions]
  );
}
