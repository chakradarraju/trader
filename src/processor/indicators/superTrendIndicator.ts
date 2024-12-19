import { BaseIndicator } from "./baseIndicator";

export interface SuperTrendTimeFrame {
  time: Date;
  price: TimeframePrice;
  tr: number;
  atr: number;
  upperBand: number;
  lowerBand: number;
  superTrend: number;
}

export interface SuperTrendContext {
  frames: SuperTrendTimeFrame[];
  latestFrame: SuperTrendTimeFrame;
}

export class SuperTrendIndicator extends BaseIndicator {
  atrPeriod: number;
  factor: number;
  context: SuperTrendContext;

  constructor(atrPeriod: number, factor: number, pastFrames: TimeframePrice[]) {
    super()
    this.atrPeriod = atrPeriod;
    this.factor = factor;
    if (pastFrames.length < atrPeriod || atrPeriod < 2) {
      throw('Not enough data error');
    }
    const firstFrame = pastFrames[0];
    const firstSuperTrendFrame = {
      time: firstFrame.time,
      price: firstFrame,
      tr: firstFrame.high - firstFrame.low,
      atr: 0,
      upperBand: 0,
      lowerBand: 0,
      superTrend: 0
    };
    this.context = {
      frames: [firstSuperTrendFrame],
      latestFrame: firstSuperTrendFrame
    };

    for (var i = 1; i < pastFrames.length; i++) {
      this.process(pastFrames[i]);
    }
  }

  trueRange(tfPrice: TimeframePrice, prevClose: number): number {
    return Math.max(
      tfPrice.high - tfPrice.low, 
      Math.abs(tfPrice.high - prevClose), 
      Math.abs(tfPrice.low - prevClose));
  }

  calculateUpperBand(newUpperBand: number, prevClose: number, lastUpperBand: number): number {
    if (!lastUpperBand) return newUpperBand;  // starting fresh
    if (newUpperBand < lastUpperBand || prevClose > lastUpperBand) return newUpperBand;
    return lastUpperBand;
  }

  calculateLowerBand(newLowerBand: number, prevClose: number, lastLowerBand: number): number {
    if (!lastLowerBand) return newLowerBand;  // starting fresh
    if (newLowerBand > lastLowerBand || prevClose < lastLowerBand) return newLowerBand;
    return lastLowerBand;
  }

  calculateNextFrame(time: Date, price: TimeframePrice, tr: number, atr: number, lastFrame: SuperTrendTimeFrame): SuperTrendTimeFrame {
    const prevClose = lastFrame.price.close;
    const average = (price.high + price.low) / 2;
    const variance = this.factor * atr;

    const upperBand = this.calculateUpperBand(average + variance, prevClose, lastFrame.upperBand);
    const lowerBand = this.calculateLowerBand(average - variance, prevClose, lastFrame.lowerBand);

    const superTrend = lastFrame.superTrend === lowerBand || price.close > upperBand ? lowerBand : upperBand;

    return { time, tr, atr, price, upperBand, lowerBand, superTrend };
  }

  calculateATR(latestTR: number): number {
    var trSum = latestTR, count = 1;
    const framesLen = this.context.frames.length;
    for (var i = 0; i < this.atrPeriod - 1; i++) if (framesLen - i - 1 >= 0) {
      try {
        trSum += this.context.frames[framesLen - i - 1].tr;
      } catch(e) {
        console.log('caught err', this.context);
        throw 'caught err';
      }
      count++;
    }
    return trSum / count;
  }

  process(price: TimeframePrice): void {
    const lastFrame = this.context.frames[this.context.frames.length - 1];
    const tr = this.trueRange(price, lastFrame.price.close);
    const atr = this.calculateATR(tr);
    
    const latestSuperTrendFrame = this.calculateNextFrame(price.time, price, tr, atr, lastFrame);
    this.context.frames.push(latestSuperTrendFrame);
    this.context.latestFrame = latestSuperTrendFrame;
  }
}