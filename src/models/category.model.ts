import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    title: String,
    description: String,
    slug: String,
    status: String,
    parent_id: String,
    thumbnail: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", schema, "categories");

export default Category;
