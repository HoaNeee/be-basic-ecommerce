import { QdrantClient } from "@qdrant/js-client-rest";
import * as mongoose from "mongoose";

export const connect = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("connect to mongodb success");
  } catch (error) {
    console.log("connect to mongodb failed " + error);
  }
};

// class QdrantClientClass {
//  private client : QdrantClient;

//   constructor(config: { url: string; apiKey: string }) {
//     this.client = new QdrantClient({
//       url: config.url,
//       apiKey: config.apiKey,
//     });
//   }

//   getClient(): QdrantClient {
//     return this.client;
//   }
// }

// export const qdrantClient = new QdrantClientClass({
//   url: process.env.QDRANT_URL,
//   apiKey: process.env.QDRANT_API_KEY,
// });

let client: QdrantClient | null = null;

export const connectQdrant = async (): Promise<void> => {
  try {
    client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    console.log("connect to qdrant success");
  } catch (error) {
    console.log("connect to qdrant failed " + error);
  }
};

export const getQdrantClient = (): QdrantClient | null => {
  return client;
};
