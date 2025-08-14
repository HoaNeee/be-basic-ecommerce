import mongoose from "mongoose";

const schema = new mongoose.Schema({
  type_sync: {
    type: String,
    enum: ["product", "blog"],
  },
  sync_time: {
    type: Date,
    default: Date.now,
  },
});

const SyncEmbedTime = mongoose.model(
  "SyncEmbedTime",
  schema,
  "sync_embed_time"
);

export default SyncEmbedTime;
