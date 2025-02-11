import { actor } from "./actor";
import { InvokeArgs } from "@/types";

export class Orchestrator {
  static async invoke(args: InvokeArgs) {
    console.log("invoke args", args);
    return actor
      .invoke(args)
      .then((data: any) => {
        console.log("invoke res", data);
        if (data?.Ok) {
          return data.Ok;
        } else {
          const error = data?.Err ?? {};
          const key = Object.keys(error)[0];
          const message = error[key];

          throw new Error(
            message
              ? key === "ErrorOccurredDuringExecution"
                ? `${key}: ${
                    message.execution_steps?.[0]?.result?.Err ?? "Unknown Error"
                  }`
                : `${key}`
              : `Invoke Error: ${JSON.stringify(data)}`
          );
        }
      })
      .catch((err) => {
        console.log("invoke error", err);
        throw err;
      });
  }

  static async getTxSent(txid: string) {
    return actor.get_tx_sent(txid).then((res: any) => {
      const errorMessage = res[0]?.status?.[0].Rejected;
      if (errorMessage) {
        return {
          status: "Rejected",
          errorMessage,
        };
      }
      return undefined;
    });
  }

  static async getUnconfirmedOutpoints(address: string): Promise<string[]> {
    const res = (await actor.get_zero_confirmed_utxos_of_address(
      address
    )) as string[];
    return res;
  }

  static async getRecommendedFee() {
    const res = (await actor.get_recommended_tx_fee_per_vbyte([])) as bigint;
    return res ? Number(res) : 5;
  }
}
