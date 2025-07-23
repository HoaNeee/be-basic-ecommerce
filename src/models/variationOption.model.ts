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
    variation_id: {
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

const VariationOption = mongoose.model(
  "VariationOption",
  schema,
  "variation-options"
);

export default VariationOption;
