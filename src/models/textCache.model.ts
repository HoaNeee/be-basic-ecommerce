import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    text_hash: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    query: {
      type: Object,
    },
    response: {
      type: [String],
    },
    expireAt: {
      type: Date,
      default: Date.now,
      expires: 3600 * 24,
    },
  },
  { timestamps: true }
);

const TextCache = mongoose.model("TextCache", schema, "text-caches");

export default TextCache;
