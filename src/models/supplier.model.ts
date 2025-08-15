import mongoose, { Schema } from "mongoose";
import slug from "mongoose-slug-updater";
mongoose.plugin(slug);

const supplierSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    categories: {
      type: [String],
    },
    slug: {
      type: String,
      slug: "name",
      unique: true,
    },
    contact: String,
    thumbnail: String,
    isTaking: {
      type: Number,
      enum: [0, 1],
    },
    email: String,
    status: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Supplier = mongoose.model("Supplier", supplierSchema, "suppliers");

export default Supplier;
