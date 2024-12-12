
export abstract class BaseIndicator {
  abstract process(time: Date, tfPrice: TimeframePrice): void;
}