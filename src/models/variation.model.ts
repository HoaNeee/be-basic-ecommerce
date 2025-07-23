import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    description: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

const Variation = mongoose.model("Variation", schema, "variations");

export default Variation;
