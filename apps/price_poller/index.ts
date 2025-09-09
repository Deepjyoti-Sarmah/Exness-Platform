import type { Kline } from "@repo/types/client";
import {
  PRICE_DECIMAL,
  VOLUME_DECIMAL,
  REDIS_QUEUE_KEY,
} from "@repo/commons/client";
import { PublishClient, PublishToRedisQueue } from "@repo/redis";

const SYMBOL = "btcusdt";
const INTERVAL = "1m";
const BINANCE_STEAM_URL = `wss://stream.binance.com:9443/ws/${SYMBOL}@kline_${INTERVAL}`;

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempsts = 5;
let reconnectDelay = 1000;

async function handlerMessages(messageData: string) {
  try {
    let data = JSON.parse(messageData);

    // only process completed klines
    if (!data.k.x) {
      return;
    }

    let klineObject: Kline = {
      timestamp: BigInt(data.k.t),
      open: Math.round(Number(parseFloat(data.k.o).toFixed(2)) * PRICE_DECIMAL),
      close: Math.round(
        Number(parseFloat(data.k.c).toFixed(2)) * PRICE_DECIMAL,
      ),
      high: Math.round(Number(parseFloat(data.k.h).toFixed(2)) * PRICE_DECIMAL),
      low: Math.round(Number(parseFloat(data.k.l).toFixed(2)) * PRICE_DECIMAL),
      volume: Math.round(
        Number(parseFloat(data.k.v).toFixed(5)) * VOLUME_DECIMAL,
      ),
    };
    console.log("Processed Kline:", klineObject);

    console.log("Publishing to kline_data_queue");
    await PublishToRedisQueue(klineObject, SYMBOL, INTERVAL, REDIS_QUEUE_KEY);
  } catch (error) {
    console.error("Error parsing message:", error);
  }
}

function handleReconnect() {
  if (reconnectAttempts >= maxReconnectAttempsts) {
    console.error("Max reconnection attepts reached. Stopped.");
    return;
  }

  reconnectAttempts++;
  console.log(
    `Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempsts} in ${reconnectDelay} ms`,
  );

  setTimeout(() => {
    connect();
  }, reconnectDelay);

  reconnectDelay = Math.min(reconnectDelay * 2, 3000); //Max 30 sec
}

function setupEventListeners(ws: WebSocket) {
  if (!ws) return;

  ws.addEventListener("open", (event) => {
    console.log("connected to binance stream");
    reconnectAttempts = 0; //reset on successful connection
    reconnectDelay = 1000; // reset delay
  });

  ws.addEventListener("message", async (event) => {
    try {
      await handlerMessages(event.data);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  ws.addEventListener("close", (event) => {
    console.log("Connection to binance closed:", event.code, event.reason);
    handleReconnect();
  });

  ws.addEventListener("error", (event) => {
    console.log("Websocket error:", event);
    handleReconnect();
  });
}

function connect() {
  try {
    ws = new WebSocket(BINANCE_STEAM_URL);
    setupEventListeners(ws);
  } catch (error) {
    console.error("Failed to create Websocket connection:", error);
    handleReconnect();
  }
}

function closeConnection() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

//Price Poller
function startPricePoller() {
  console.log("Starting price poller...");
  connect();
}

function setupGracefulShutdown() {
  process.on("SIGINT", () => {
    console.log("Received SIGINT. Graceful shutdown");
    closeConnection();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM. Graceful shutdown");
    closeConnection();
    process.exit(0);
  });
}

startPricePoller();
setupGracefulShutdown();
