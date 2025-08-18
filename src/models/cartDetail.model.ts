import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    cart_id: {
      type: String,
      required: true,
    },
    product_id: String,
    sub_product_id: String,
    slug: String,
    options: [String],
    quantity: Number,
    productType: {
      type: String,
      enum: ["simple", "variations"],
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const CartDetail = mongoose.model("CartDetail", schema, "cart-details");

export default CartDetail;
