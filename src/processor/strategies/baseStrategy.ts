import { Action, ActionType, Holding, Order, PriceType } from "@/schema/actions";
import { OrderManager } from "../orderManager/orderManager";

const STOPLOSS_COOLOFF = 24 * 60 * 60 * 1000;

export abstract class BaseStrategy {
  symbol: string;
  orderManager: OrderManager;
  stoplossThreshold?: number;
  lastStopLoss: Date | null;

  constructor(symbol: string, orderManager: OrderManager, stoplossThreshold?: number) {
    this.symbol = symbol;
    this.orderManager = orderManager;
    this.stoplossThreshold = stoplossThreshold;
    this.lastStopLoss = null;
  }

  abstract process(time: Date, tfPrice: TimeframePrice): void;

  abstract buyQuantity(time: Date, price: TimeframePrice, holding: Holding, orders: Order[]): number;

  abstract sellQuantity(time: Date, price: TimeframePrice, holding: Holding, orders: Order[]): number;

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
    const orders = this.orderManager.getOrders();
    const buyQty = this.buyQuantity(time, tfPrice, currentPosition, orders);
    const sellQty = this.sellQuantity(time, tfPrice, currentPosition, orders);
    if (buyQty > 0 && sellQty > 0) throw `Something wrong buy: ${buyQty} ${sellQty} at ${time.toISOString()}`;
    if (buyQty > 0) {  // Buy
      if (this.lastStopLoss !== null && time.getTime() - this.lastStopLoss.getTime() < STOPLOSS_COOLOFF) {
        console.log('Skipping buy suggestion because of stop loss', (time.getTime() - this.lastStopLoss.getTime()) / 1000);
      }
      if (currentPosition.cash > openPrice) {  // We have enough to buy
        this.execute(time, ActionType.Buy, openPrice, buyQty);
        if (this.stoplossThreshold) this.execute(time, ActionType.StopLoss, openPrice * this.stoplossThreshold, buyQty);
      }
    } else if (sellQty > 0) {  // Sell
      if (currentPosition.units > 0) {  // We have units to sell
        this.execute(time, ActionType.Sell, openPrice, sellQty);
      }
    }
  }

}