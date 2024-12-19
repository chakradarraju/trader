import { Action, ActionType, Holding, Order, PriceType } from "@/schema/actions";
import { SuperTrendIndicator } from "../indicators/superTrendIndicator";
import { OrderManager } from "../orderManager/orderManager";
import { BaseStrategy } from "./baseStrategy";

export class SuperTrendStrategy extends BaseStrategy {
  indicator: SuperTrendIndicator;

  constructor(symbol: string, period: number, factor: number, pastFrames: {price: TimeframePrice, time: Date}[], orderManager: OrderManager, stoplossThreshold?: number) {
    super(symbol, orderManager, stoplossThreshold);
    this.indicator = new SuperTrendIndicator(period, factor, pastFrames);
  }

  buyQuantity(time: Date, price: TimeframePrice, holding: Holding, orders: Order[]): number {
    return this.indicator.context.latestFrame.superTrend < price.open ? Math.floor(holding.cash / price.open) : 0;
  }

  sellQuantity(time: Date, price: TimeframePrice, holding: Holding, orders: Order[]): number {
    return this.indicator.context.latestFrame.superTrend > price.open ? holding.units : 0;
  }

  process(time: Date, tfPrice: TimeframePrice) {
    this.buyOrSellBasedOnPastData(time, tfPrice);
    this.indicator.process(time, tfPrice);
  }
}