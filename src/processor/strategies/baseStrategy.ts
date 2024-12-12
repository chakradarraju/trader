import { OrderManager } from "../orderManager/orderManager";

export abstract class BaseStrategy {
  orderManager: OrderManager;

  constructor(orderManager: OrderManager) {
    this.orderManager = orderManager;
  }

  abstract process(time: Date, tfPrice: TimeframePrice): void;
}