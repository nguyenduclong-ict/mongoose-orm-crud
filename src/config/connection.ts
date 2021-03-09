import { createConnection } from "mongoose-orm";

export const connection = createConnection(
  process.env.MONGO_URI || {
    user: process.env.MONGO_USERNAME,
    pass: process.env.MONGO_PASSWORD,
    dbName: process.env.MONGO_DBNAME,
    host: process.env.MONGO_HOST || "localhost",
    port: process.env.MONGO_PORT || 27017,
    authSource: process.env.MONGO_AUTH_SOURCE,
  }
);
