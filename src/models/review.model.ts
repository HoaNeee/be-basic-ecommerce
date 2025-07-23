import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    product_id: {
      type: String,
      required: true,
    },
    title: String,
    content: String,
    star: Number,
    images: [String],
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", schema, "reviews");

export default Review;
