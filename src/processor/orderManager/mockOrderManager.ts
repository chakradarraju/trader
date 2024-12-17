import { OrderManager } from "./orderManager";
import { Order, Holding, ActionType, PriceType } from "@/schema/actions";
import { Action, ActionStatus } from "@/schema/actions";

export class MockOrderManager extends OrderManager {
  symbol: string;
  orders: Order[];
  stopLossLimit: number | null;
  units: number;
  nextId: number;
  cash: number;

  constructor(symbol: string, cash: number, units: number) {
    super()
    this.symbol = symbol;
    this.orders = [];
    this.stopLossLimit = null;
    this.units = units;
    this.nextId = 1;
    this.cash = cash;
  }

  process(action: Action): ActionStatus {
    if (action.type === ActionType.StopLoss) {
      this.stopLossLimit = action.limit;
      return ActionStatus.Pending;
    } else {
      if (action.type === ActionType.Buy) {
        this.buy(action);
      } else {
        this.sell(action);
      }  
    }
    return ActionStatus.Filled;
  }

  buy(action: Action) {
    if (Math.abs(action.limit * action.quantity) > this.cash) throw `Not enough cash for buying ${action.quantity} at ${action.limit}, only have ${this.cash}, diff ${(action.limit * action.quantity) - this.cash}`;
    this.cash -= action.limit * action.quantity;
    this.units += action.quantity;
    this.rememberOrder(action);
  }

  sell(action: Action) {
    if (action.type === ActionType.Sell && action.quantity > this.units) throw `Not enough units to sell: requested ${action.quantity}, available ${this.units}`;
    const unitsAvailableForSale = Math.min(action.quantity, this.units);
    this.cash += action.limit * unitsAvailableForSale;
    this.units -= unitsAvailableForSale;
    if (this.units === 0) this.stopLossLimit = null;
    this.rememberOrder(action);
  }

  rememberOrder(action: Action) {
    console.log(`${action.type} at ${action.limit} ${action.quantity} ${action.time.toISOString()} portfolio: ${this.printHolding(action.limit)}`)
    this.orders.push({
      extId: '' + this.nextId++,
      action,
      status: ActionStatus.Filled
    });
  }

  processStopLoss(time: Date, tfPrice: TimeframePrice): boolean {
    if (this.stopLossLimit !== null && tfPrice.low < this.stopLossLimit && this.units > 0) {
      this.sell({
        symbol: this.symbol,
        type: ActionType.StopLoss,
        price: PriceType.Limit,
        limit: this.stopLossLimit,
        quantity: this.units,
        time,
      });
      return true;
    }
    return false;
  }

  getHolding(): Holding {
    return {
      units: this.units,
      cash: this.cash
    }
  }

  printHolding(price: number): string {
    const val = this.units * price;
    return `${this.cash} + ${this.units} * ${price} (${val}) = ${this.cash + val}`;
  }

  getOrders(): Order[] {
    return this.orders;
  }
}