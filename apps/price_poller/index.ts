const symbol = "btcusdt";
const interval = "1m";

const BINANCE_STEAM_URL = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;

const ws = new WebSocket(BINANCE_STEAM_URL);

ws.addEventListener("open", (event) => {
  console.log("connected to binance stream");
});

ws.addEventListener("message", (event) => {
  console.log("message: ", JSON.stringify(event.data));
});

ws.addEventListener("close", (event) => {
  console.log("clossing connection to binance");
});

ws.addEventListener("error", (event) => {
  console.log("error in connection");
});
