import { Action, ActionType, PriceType } from "@/schema/actions";
import { SuperTrendIndicator } from "../indicators/superTrendIndicator";
import { OrderManager } from "../orderManager/orderManager";
import { BaseStrategy } from "./baseStrategy";

export class SuperTrendStrategy extends BaseStrategy {
  indicator: SuperTrendIndicator;
  symbol: string;

  constructor(symbol: string, period: number, factor: number, pastFrames: {price: TimeframePrice, time: Date}[], orderManager: OrderManager) {
    super(orderManager);
    this.indicator = new SuperTrendIndicator(period, factor, pastFrames);
    this.symbol = symbol;
  }

  execute(time: Date, type: ActionType, limit: number, quantity: number) {
    const action: Action = {
      time,
      symbol: this.symbol,
      price: PriceType.Limit,
      type,
      limit,
      quantity,
    }
    this.orderManager.process(action);
    console.log(`${type} at ${limit} ${time.toISOString()} portfolio: ${this.orderManager.printHolding(limit)}`)
  }

  buyOrSellBasedOnPastData(time: Date, openPrice: number) {
    const currentPosition = this.orderManager.getHolding();
    if (this.indicator.context.latestFrame.superTrend < openPrice) {  // Buy
      if (currentPosition.cash > openPrice) {  // We have enough to buy
        this.execute(time, ActionType.Buy, openPrice, Math.floor(currentPosition.cash / openPrice));
      }
    } else {  // Sell
      if (currentPosition.units > 0) {  // We have units to sell
        this.execute(time, ActionType.Sell, openPrice, currentPosition.units);
      }
    }
  }

  process(time: Date, tfPrice: TimeframePrice) {
    this.buyOrSellBasedOnPastData(time, tfPrice.open);
    this.indicator.process(time, tfPrice);
  }
}