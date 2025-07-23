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
    review_id: {
      type: String,
      required: true,
    },
    parent_id: String,
    content: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", schema, "comments");

export default Comment;
