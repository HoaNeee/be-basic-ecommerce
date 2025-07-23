import mongoose, { Schema } from "mongoose";
import slug from "mongoose-slug-updater";
mongoose.plugin(slug);

const schema = new Schema(
  {
    title: String,
    content: String,
    shortDescription: String,
    categories: {
      type: [String],
    },
    slug: {
      type: String,
      slug: "title",
      unique: true,
    },
    price: Number,
    // SKU: {
    //   type: String,
    //   index: true,
    //   unique: true
    // },
    SKU: {
      type: String,
      index: true,
    },
    stock: Number,
    discountedPrice: Number,
    cost: Number, //last cost
    productType: {
      type: String,
      default: "simple",
      enum: ["simple", "variations"],
    },
    thumbnail: String,
    images: [String],
    supplier_id: String,
    status: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", schema, "products");

export default Product;
