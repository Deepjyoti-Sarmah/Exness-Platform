import type { Kline } from "@repo/types/client";
import { PRICE_DECIMAL, VOLUME_DECIMAL } from "@repo/commons/client";

const symbol = "btcusdt";
const interval = "1m";

const BINANCE_STEAM_URL = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;

const ws = new WebSocket(BINANCE_STEAM_URL);

ws.addEventListener("open", (event) => {
  console.log("connected to binance stream");
});

ws.addEventListener("message", (event) => {
  let data = JSON.parse(event.data);
  let klineObject = {
    event: data.e,
    eventTime: data.E,
    startTime: data.k.t,
    open: Math.round(Number(parseFloat(data.k.o).toFixed(2)) * PRICE_DECIMAL),
    close: Math.round(Number(parseFloat(data.k.c).toFixed(2)) * PRICE_DECIMAL),
    high: Math.round(Number(parseFloat(data.k.h).toFixed(2)) * PRICE_DECIMAL),
    low: Math.round(Number(parseFloat(data.k.h).toFixed(2)) * PRICE_DECIMAL),
    volume: Math.round(
      Number(parseFloat(data.k.v).toFixed(5)) * VOLUME_DECIMAL,
    ),
    isClose: data.k.x,
  };
  console.log("Kline object", klineObject);
});

ws.addEventListener("close", (event) => {
  console.log("clossing connection to binance");
});

ws.addEventListener("error", (event) => {
  console.log("error in connection");
});
