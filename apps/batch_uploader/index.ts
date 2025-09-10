import type { KlineDbData, KlineQueueData } from "@repo/types/client";
import { SubscribClient, GetQueueLength } from "@repo/redis";
import { REDIS_QUEUE_KEY } from "@repo/commons/client";

const BATCH_SIZE = 100;
const BATCH_TIMEOUT = 5000;

let batch: KlineDbData[] = [];
let batchTimer: Timer | null = null;
let isProcessing = false;

async function insertIntoTimescalDB(klineDB: KlineDbData[]) {}

async function processBatch() {
  if (isProcessing || batch.length === 0) {
    return;
  }

  isProcessing = true;

  try {
    const batchProcess = [...batch];
    batch = [];

    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }

    console.log(`Process batch of ${batchProcess.length} items`);
    await insertIntoTimescalDB(batchProcess);
    console.log(`Successfully processed batch of ${batchProcess.length} items`);
  } catch (error) {
    console.error("Error processing batches:", error);
  } finally {
    isProcessing = false;
  }
}

function setBatchTimeout() {
  if (batchTimer) {
    clearTimeout(batchTimer);
  }

  setTimeout(async () => {
    if (batch.length > 0) {
      console.log(`Batch timeout reached. Processing ${batch.length} items`);
      await processBatch();
    }
  }, BATCH_TIMEOUT);
}

async function addToBatch(rawData: string) {
  try {
    // process the data
    const queueData: KlineQueueData = JSON.parse(rawData);

    const dataDB: KlineDbData = {
      timestamp: new Date(queueData.timestamp),
      open: queueData.open,
      close: queueData.close,
      high: queueData.high,
      low: queueData.low,
      volume: queueData.volume,
      symbol: queueData.symbol,
      interval: queueData.interval,
      createdAt: queueData.createdAt,
    };

    batch.push(dataDB);
    console.log(
      `Added to batch. Current batch size:  ${batch.length}/${BATCH_SIZE}`,
    );

    // set the batchTimer for the 1st item
    if (batch.length === 1) {
      setBatchTimeout();
    }

    // process the batch
    if (batch.length >= BATCH_SIZE) {
      console.log(`Batch size reached. Processing ${batch.length} items`);
      await processBatch();
    }
  } catch (error) {
    console.error("Error addding to batch:", error);
  }
}

async function startBatchProcess() {
  console.log("Starting batch processing...");
  console.log(`Batch size: ${BATCH_SIZE}, Timeout: ${BATCH_TIMEOUT}ms`);

  const monitorQueueLength = setInterval(async () => {
    const queueLength = await GetQueueLength(REDIS_QUEUE_KEY);
    if (queueLength > 0) {
      console.log(` Queue length: ${queueLength}, Batch size: ${batch.length}`);
    }
  }, 30000);

  while (true) {
    try {
      // take out from queue
      const result = await SubscribClient.rpop(REDIS_QUEUE_KEY);
      // add to batch
      if (result && result.length === 2) {
        const [, data] = result;
        await addToBatch(JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error processing queue:", error);
    }
  }
}

function setupGracefullShutdown() {
  const gracefulShutdown = async (signal: string) => {
    console.log(
      `Receive ${signal}. Gracefully shutting down batch uploader...`,
    );

    if (batch.length > 0) {
      console.log(`Processing final batch of ${batch.length} items...`);
      try {
        //TODO: processBatch
      } catch (error) {
        console.error("Error processing final batch:", error);
      }
    }

    console.log("Batch uploader shutdown complete");
    process.exit(0);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
}

startBatchProcess();
setupGracefullShutdown();
