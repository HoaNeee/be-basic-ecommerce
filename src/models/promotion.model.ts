import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    title: String,
    description: String,
    code: {
      type: String,
      required: true,
    },
    startAt: Date,
    endAt: Date,
    promotionType: {
      type: String,
      enum: ["percent", "discount"],
      default: "percent",
    },
    value: {
      type: Number,
      required: true,
    },
    colorText: String,
    maxUse: Number,
    thumbnail: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Promotion = mongoose.model("Promotion", schema, "promotions");

export default Promotion;
