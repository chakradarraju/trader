import { Action, ActionType, PriceType } from "@/schema/actions";
import { SuperTrendIndicator } from "../indicators/superTrendIndicator";
import { OrderManager } from "../orderManager/orderManager";
import { BaseStrategy } from "./baseStrategy";

const STOPLOSS_COOLOFF = 24 * 60 * 60 * 1000;

export class SuperTrendStrategy extends BaseStrategy {
  indicator: SuperTrendIndicator;
  symbol: string;
  lastStopLoss: Date | null;

  constructor(symbol: string, period: number, factor: number, pastFrames: {price: TimeframePrice, time: Date}[], orderManager: OrderManager) {
    super(orderManager);
    this.indicator = new SuperTrendIndicator(period, factor, pastFrames);
    this.symbol = symbol;
    this.lastStopLoss = null;
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
  }

  buyOrSellBasedOnPastData(time: Date, tfPrice: TimeframePrice) {
    const openPrice = tfPrice.open;
    if (this.orderManager.processStopLoss(time, tfPrice)) {
      this.lastStopLoss = time;
    }
    const currentPosition = this.orderManager.getHolding();
    if (this.indicator.context.latestFrame.superTrend < openPrice) {  // Buy
      if (this.lastStopLoss !== null && time.getTime() - this.lastStopLoss.getTime() < STOPLOSS_COOLOFF) {
        console.log('Skipping buy suggestion because of stop loss', (time.getTime() - this.lastStopLoss.getTime()) / 1000);
      }
      if (currentPosition.cash > openPrice) {  // We have enough to buy
        const quantity = Math.floor(currentPosition.cash / openPrice);
        this.execute(time, ActionType.Buy, openPrice, quantity);
        this.execute(time, ActionType.StopLoss, openPrice * 0.98, quantity);
      }
    } else {  // Sell
      if (currentPosition.units > 0) {  // We have units to sell
        this.execute(time, ActionType.Sell, openPrice, currentPosition.units);
      }
    }
  }

  process(time: Date, tfPrice: TimeframePrice) {
    this.buyOrSellBasedOnPastData(time, tfPrice);
    this.indicator.process(time, tfPrice);
  }
}