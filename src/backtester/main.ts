import Papa from "papaparse";
import minimist from 'minimist';
import fs from 'fs';
import { MockOrderManager } from "@/processor/orderManager/mockOrderManager";
import { SuperTrendStrategy } from "@/processor/strategies/superTrendStrategy";

const argv = minimist(process.argv.slice(2));

if (!argv.file) {
  console.error('file argument missing');
  process.exit(1);
}

const d: {price: TimeframePrice, time: Date}[] = [];
var cnt = 0;

const csvFile = fs.readFileSync(argv.file, 'utf8');

var orderManager: MockOrderManager | null = null;
var superTrendStrategy: SuperTrendStrategy | null = null;

function time(row: any): Date {
  return new Date(row.data.time * 1000);
}

function price(row: any): TimeframePrice {
  return {
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
    if (cnt < 10) {
      d.push({
        price: price(row),
        time: time(row)
      });  
    } else if (cnt === 10) {
      orderManager = new MockOrderManager('CRUDEM', 100000, 0);
      superTrendStrategy = new SuperTrendStrategy('CRUDEM', 10, 3, d, orderManager);
    } else {
      superTrendStrategy?.process(time(row), price(row));
    }
    cnt++;
  },
  complete: () => {
    console.log('done');
  }
});