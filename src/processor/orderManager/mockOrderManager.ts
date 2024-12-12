import { OrderManager } from "./orderManager";
import { Order, Holding, ActionType } from "@/schema/actions";
import { Action, ActionStatus } from "@/schema/actions";

export class MockOrderManager extends OrderManager {
  orders: Order[];
  units: number;
  nextId: number;
  cash: number;

  constructor(cash: number, units: number) {
    super()
    this.orders = [];
    this.units = units;
    this.nextId = 1;
    this.cash = cash;
  }

  process(action: Action): ActionStatus {
    this.orders.push({
      extId: '' + this.nextId++,
      action,
      status: ActionStatus.Filled
    });
    if (action.type === ActionType.Buy) {
      if (Math.abs(action.limit * action.quantity) > this.cash) throw 'Not enough cash';
      this.cash -= action.limit * action.quantity;
      this.units += action.quantity;
    } else {
      if (action.quantity > this.units) throw 'Not enough units';
      this.cash += action.limit * action.quantity;
      this.units -= action.quantity;
    }

    return ActionStatus.Filled;
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