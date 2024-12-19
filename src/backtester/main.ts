import Papa from "papaparse";
import minimist from 'minimist';
import fs from 'fs';
import { MockOrderManager } from "@/processor/orderManager/mockOrderManager";
import { SuperTrendStrategy } from "@/processor/strategies/superTrendStrategy";
import { BaseStrategy } from "@/processor/strategies/baseStrategy";
import { RSIStrategy } from "@/processor/strategies/RSIStrategy";

enum Strategy {
  SUPERTREND = 'supertrend',
  RSI = 'rsi'
}

const argv = minimist(process.argv.slice(2));
const datafile = argv.file;
const period = argv.period ?? 14;
const cash = argv.cash ?? 1000000;
const strategyName: Strategy = argv.strategy ?? Strategy.RSI;
const stoplossThreshold: number | undefined = argv.stoplossThreshold;

if (stoplossThreshold && (stoplossThreshold < 0 || stoplossThreshold >= 1)) {
  console.error('Stoploss threshold needs to be between 0 and 1');
  process.exit(1);
}

if (!datafile) {
  console.error('file argument missing');
  process.exit(1);
}

const d: TimeframePrice[] = [];
var cnt = 0;

const csvFile = fs.readFileSync(datafile, 'utf8');

var orderManager: MockOrderManager | null = null;
var strategy: BaseStrategy | null = null;

function frame(row: any): TimeframePrice {
  return {
    time: new Date(row.data.time * 1000),
    open: row.data.open,
    close: row.data.open,
    high: row.data.high,
    low: row.data.low
  };
}

Papa.parse(csvFile, {
  header: true,
  dynamicTyping: true,
  step: (row: any) => {
    if (cnt < period) {
      d.push(frame(row));  
    } else if (cnt === period) {
      orderManager = new MockOrderManager('CRUDEM', cash, 0);
      if (strategyName === Strategy.SUPERTREND) {
        strategy = new SuperTrendStrategy('CRUDEM', period, argv.superTrendFactor, d, orderManager, stoplossThreshold);
      } else if (strategyName === Strategy.RSI) {
        strategy = new RSIStrategy('CRUDEM', period, d, orderManager, stoplossThreshold);
      }
    } else {
      strategy?.process(frame(row));
    }
    cnt++;
  },
  complete: () => {
    console.log('done');
  }
});