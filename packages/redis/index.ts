import { RedisClient } from "bun";
import type { Kline } from "@repo/types/client";

// Publishing data to queue
export const PublishClient = new RedisClient(
  process.env.REDIS_URL || "redis://localhost:6379",
);

PublishClient.onconnect = () => {
  console.log("Connected to Publishing Redis client");
};

PublishClient.onclose = (error) => {
  console.log("Disconnected from redis Publisher Client Server ", error);
};

// Consumming data from queue
export const SubscribClient = new RedisClient(
  process.env.REDIS_URL || "redis://localhost:6379",
);

SubscribClient.onconnect = () => {
  console.log("Connected to Subscriber redis client");
};

SubscribClient.onclose = (error) => {
  console.log("Disconnected from Subscriber Redis Client Server", error);
};

export async function PublishToRedisQueue(
  kineData: Kline,
  symbol: string,
  interval: string,
  queueKey: string,
) {
  try {
    const seralizedData = JSON.stringify({
      ...kineData,
      timestamp: kineData.timestamp.toString(),
      symbol: symbol,
      interval: interval,
      createdAt: Date.now(),
    });

    await PublishClient.lpush(queueKey, seralizedData);

    console.log(`Data published to Redis queue: ${queueKey}`);
  } catch (error) {
    console.error("Error publishing to Redis:", error);
    throw error;
  }
}

export async function GetQueueLength(queueKey: string) {
  try {
    return await SubscribClient.llen(queueKey);
  } catch (error) {
    console.error("Error getting queue length:", error);
    return 0;
  }
}

await PublishClient.connect();
await SubscribClient.connect();

export { RedisClient };
