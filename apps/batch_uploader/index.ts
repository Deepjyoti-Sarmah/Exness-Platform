import type { KlineDbData } from "@repo/types/client";

const BATCH_SIZE = 100;
const BATCH_TIMEOUT = 5000;

let batch: KlineDbData[] = [];
let batchTimer: Timer | null = null;
let isProcessing = false;

function startBatchProcess() {
  // infinite loop,
  // take out from queue
  // add to batch
  // check batchtimeout
  // process the batch
  // insert into timescaledb
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
