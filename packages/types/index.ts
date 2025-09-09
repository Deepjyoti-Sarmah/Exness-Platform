export type Kline = {
  timestamp: bigint | string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
};

export type KlineQueueData = {
  timestamp: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  symbol: string;
  interval: string;
  createdAt: number;
};

export type KlineDbData = {
  timestamp: Date;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  symbol: string;
  interval: string;
  createdAt: number;
};
