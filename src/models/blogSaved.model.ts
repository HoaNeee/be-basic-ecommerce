import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    blogs: [String],
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const BlogSaved = mongoose.model("BlogSaved", schema, "blog-saveds");

export default BlogSaved;
