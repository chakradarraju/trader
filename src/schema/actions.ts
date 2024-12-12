
export type Action = {
  symbol: string;
  type: ActionType;
  price: PriceType;
  limit: number;
  quantity: number;
  time: Date;
  origin?: string;
  reason?: string;
}

export enum ActionType {
  Buy = "BUY",
  Sell = "SELL"
}

export enum PriceType {
  Limit,
  Market
}

export enum ActionStatus {
  Pending,
  Filled,
  Cancelled
}

export type Holding = {
  units: number;
  cash: number;
};

export type Order = {
  extId: string;
  action: Action;
  status: ActionStatus;
};

