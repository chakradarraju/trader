import { BaseIndicator } from "./baseIndicator";

export interface RSIFrame {
  time: Date;
  price: TimeframePrice;
  downwardChange: number;
  upwardChange: number;
  rsi: number;
}

export interface RSIContext {
  frames: RSIFrame[];
  latestFrame: RSIFrame;
}

export class RSI extends BaseIndicator {
  period: number;
  context: RSIContext;

  constructor(period: number, pastFrames: TimeframePrice[]) {
    super();
    this.period = period;
    if (pastFrames.length < period || period < 2) {
      throw('Not enough data error');
    }

    const firstFrame = pastFrames[0];
    const firstRSIFrame = {
      time: firstFrame.time,
      price: firstFrame,
      upwardChange: 0,
      downwardChange: 0,
      rsi: 0
    }
    this.context = {
      frames: [firstRSIFrame],
      latestFrame: firstRSIFrame
    }
    for (var i = 1; i < pastFrames.length; i++) {
      this.process(pastFrames[i]);
    }
  }

  calculateRSI(upwardChange: number, downwardChange: number): number {
    const framesLen = this.context.frames.length;
    var count = 1;
    for (var i = 0; i < this.period - 1; i++) if (framesLen - i - 1 >= 0) {
      upwardChange += this.context.frames[framesLen - i - 1].upwardChange;
      downwardChange += this.context.frames[framesLen - i - 1].downwardChange;
      count++;
    }
    upwardChange /= count;
    downwardChange /= count;

    return 100 - (100 / (1 + upwardChange / downwardChange));
  }

  process(price: TimeframePrice): void {
    const lastFrame = this.context.frames[this.context.frames.length - 1];
    const lastClose = lastFrame.price.close;
    const upwardChange = Math.max(0, price.close - lastClose);
    const downwardChange = Math.max(0, lastClose - price.close);
    const rsi = this.calculateRSI(upwardChange, downwardChange);
    const latestFrame = {
      time: price.time,
      price,
      upwardChange,
      downwardChange,
      rsi
    };
    this.context.frames.push(latestFrame);
    this.context.latestFrame = latestFrame;
  }
}