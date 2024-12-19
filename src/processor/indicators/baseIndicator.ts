
export abstract class BaseIndicator {
  abstract process(tfPrice: TimeframePrice): void;
}