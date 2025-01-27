import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
} from "@xyflow/react";

import { ellipseMiddle } from "@/lib/utils";
import React, { memo } from "react";

import { Handle, Position } from "@xyflow/react";
import { useClipboard } from "@/hooks/use-clipboard";
import { Check, Copy } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { UserCircle, Waves } from "lucide-react";
import { Button } from "./ui/button";

const enum WalletType {
  User,
  Pool,
}

const WalletNode = memo(
  ({
    data,
  }: {
    data: {
      label: string;
      address: string;
      type: WalletType;
    };
  }) => {
    const { onCopy, hasCopied } = useClipboard(data.address);
    return (
      <>
        <Handle type="target" position={Position.Left} id="input-0" />
        <Handle type="target" position={Position.Left} id="input-1" />
        <Handle type="target" position={Position.Left} id="input-2" />
        <div className="flex items-center gap-3 p-3 rounded-lg">
          {data.type === WalletType.Pool ? (
            <Waves className="text-muted-foreground/50" />
          ) : (
            <UserCircle className="text-muted-foreground/50" />
          )}
          <div className="flex flex-col items-center">
            <div>
              <span className="font-semibold">{data.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-link">
                {ellipseMiddle(data.address, 6)}
              </span>
              <Button
                onClick={onCopy}
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground"
              >
                {hasCopied ? <Check /> : <Copy />}
              </Button>
            </div>
          </div>
        </div>
        <Handle type="source" position={Position.Right} id="output-0" />
        <Handle type="source" position={Position.Right} id="output-1" />
        <Handle type="source" position={Position.Right} id="output-2" />
      </>
    );
  }
);

const InputNode = memo(
  ({
    data,
  }: {
    data: {
      label: string;
      value: string;
      symbol: string;
    };
  }) => {
    return (
      <>
        <div className="flex p-2 gap-2 items-center bg-blue-300/10 border border-white/20 rounded-lg">
          <div className="text-xs text-muted-foreground">{data.label}</div>
          <div className="flex font-semibold text-sm gap-1">
            <span>{data.value}</span>
            <span>{data.symbol}</span>
          </div>
        </div>
        <Handle type="source" position={Position.Right} />
      </>
    );
  }
);

const OutputNode = memo(
  ({
    data,
  }: {
    data: {
      label: string;
      value: string;
      symbol: string;
    };
  }) => {
    return (
      <>
        <Handle type="target" position={Position.Left} />
        <div className="flex p-2 gap-2 items-center bg-yellow-200/10 border border-white/20 rounded-lg">
          <div className="text-xs text-muted-foreground">{data.label}</div>
          <div className="flex font-semibold text-sm gap-1">
            <span>{data.value}</span>
            <span>{data.symbol}</span>
          </div>
        </div>
      </>
    );
  }
);

const nodeTypes = {
  walletNode: WalletNode,
  inputNode: InputNode,
  outputNode: OutputNode,
};

const initialNodes = [
  {
    id: "user-pool",
    type: "group",
    position: {
      x: 252,
      y: 40,
    },
    style: {
      width: 240,
      height: 320,
    },
    data: {},
  },
  {
    id: "input-0",
    position: {
      x: 40,
      y: 50,
    },
    type: "inputNode",
    data: {
      label: "Input0",
      value: "0.00012",
      symbol: "BTC",
    },
  },
  {
    id: "input-1",
    position: {
      x: 40,
      y: 130,
    },
    type: "inputNode",
    data: {
      label: "Input1",
      value: "100",
      symbol: "RICH",
    },
  },
  {
    id: "input-2",
    position: {
      x: 40,
      y: 240,
    },
    type: "inputNode",
    data: {
      label: "Input2",
      value: "100",
      symbol: "RICH",
    },
  },
  {
    id: "user",
    position: { x: 280, y: 80 },
    type: "walletNode",
    data: {
      label: "User Wallet",
      type: WalletType.User,
      address: "bc1qvwvcttn5dtxleu73uuyh8w759gukjr22l7z503",
    },
  },
  {
    id: "pool",
    position: { x: 280, y: 220 },
    type: "walletNode",
    data: {
      label: "BTC/RICH Pool",
      type: WalletType.Pool,
      address: "bc1qvwvcttn5dtxleu73uuyh8w759gukjr22l7z503",
    },
  },
  {
    id: "output-0",
    position: {
      x: 580,
      y: 50,
    },
    type: "outputNode",
    data: {
      label: "Output0",
      value: "100",
      symbol: "RICH",
    },
  },
  {
    id: "output-1",
    position: {
      x: 580,
      y: 130,
    },
    type: "outputNode",
    data: {
      label: "Output1",
      value: "0.0001",
      symbol: "BTC",
    },
  },
  {
    id: "output-2",
    position: {
      x: 580,
      y: 200,
    },
    type: "outputNode",
    data: {
      label: "Output2",
      value: "0.0001",
      symbol: "BTC",
    },
  },
  {
    id: "output-3",
    position: {
      x: 580,
      y: 280,
    },
    type: "outputNode",
    data: {
      label: "Output3",
      value: "1000",
      symbol: "RICH",
    },
  },
];
const initialEdges = [
  { id: "input-0-user", source: "input-0", target: "user" },
  { id: "input-1-user", source: "input-1", target: "user" },
  { id: "input-2-pool", source: "input-2", target: "pool" },
  { id: "user-output-0", source: "user", target: "output-0", animated: true },
  { id: "user-output-1", source: "user", target: "output-1", animated: true },
  { id: "pool-output-2", source: "pool", target: "output-2", animated: true },
  { id: "pool-output-3", source: "pool", target: "output-3", animated: true },
];

export function TxFlow() {
  return (
    <ReactFlow
      colorMode="dark"
      nodes={initialNodes}
      nodeTypes={nodeTypes}
      edges={initialEdges}
      fitView
    >
      <Background />
    </ReactFlow>
  );
}
