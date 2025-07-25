import slug from "mongoose-slug-updater";
import mongoose, { Schema } from "mongoose";
mongoose.plugin(slug);

const schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    title: String,
    excerpt: String,
    content: String,
    image: String,
    slug: {
      type: String,
      slug: "title",
      unique: true,
    },
    view: Number,
    liked: [String],
    tags: [String],
    readTime: Number,
    status: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", schema, "blogs");

export default Blog;
