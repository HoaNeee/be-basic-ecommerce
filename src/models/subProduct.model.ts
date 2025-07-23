import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    product_id: {
      type: String,
      required: true,
    },
    price: Number,
    thumbnail: String,
    stock: Number,
    SKU: {
      type: String,
      index: true,
    },
    status: String,
    cost: Number, //last cost
    discountedPrice: Number,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

const SubProduct = mongoose.model("SubProduct", schema, "sub-products");

export default SubProduct;
