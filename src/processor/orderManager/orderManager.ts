import { Action, ActionStatus, Holding, Order } from "@/schema/actions";

export abstract class OrderManager {
  abstract process(action: Action): ActionStatus;

  abstract getHolding(): Holding;

  abstract getOrders(): Order[];

  abstract printHolding(price: number): string;
}