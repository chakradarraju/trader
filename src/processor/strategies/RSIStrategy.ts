import { ActionType, Holding, Order } from "@/schema/actions";
import { RSI } from "../indicators/RSI";
import { OrderManager } from "../orderManager/orderManager";
import { BaseStrategy } from "./baseStrategy";

const HOUR = 1000 * 60 * 60;

export class RSIStrategy extends BaseStrategy {
  indicator: RSI;
  lastStopLoss: Date | null;

  constructor(symbol: string, period: number, pastFrames: TimeframePrice[], orderManager: OrderManager, stoplossThreshold?: number) {
    super(symbol, orderManager, stoplossThreshold);
    this.symbol = symbol;
    this.indicator = new RSI(period, pastFrames);
    this.lastStopLoss = null;
  }

  isThereOrderSince(orders: Order[], type: ActionType, since: Date): boolean {
    var i = 0;
    while (i < orders.length) {
      const order = orders[orders.length - 1 - i];
      if (order.action.time > since) return true;
      if (order.action.time < since) break;
    }
    return false;
  }

  buyQuantity(price: TimeframePrice, holding: Holding, orders: Order[]): number {
    const frames = this.indicator.context.frames;
    if (frames.length < 2) return 0;
    const prevRsi = frames[frames.length - 2].rsi;
    const rsi = this.indicator.context.latestFrame.rsi;
    if (prevRsi < 30 && rsi >= 30) {
      return Math.floor(holding.cash / price.open);
    }
    // if (rsi < 40) {
    //   const since = new Date(new Date().getTime() - 10 * HOUR);
    //   if (!this.isThereOrderSince(orders, ActionType.Buy, since)) {
    //     return Math.floor((0.25 * holding.cash) / price.open);
    //   }
    // }
    return 0;
  }

  sellQuantity(price: TimeframePrice, holding: Holding, orders: Order[]): number {
    const rsi = this.indicator.context.latestFrame.rsi;
    if (rsi > 70) {

      return holding.units;
    }
    if (rsi > 60) {
      const since = new Date(new Date().getTime() - 10 * HOUR);
      if (!this.isThereOrderSince(orders, ActionType.Sell, since)) {
        return Math.floor(holding.units * 0.5);
      }
    }
    return 0;
  }

  process(tfPrice: TimeframePrice): void {
    this.buyOrSellBasedOnPastData(tfPrice);
    this.indicator.process(tfPrice);
  }
}