import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    products: [
      {
        title: String,
        price: Number,
        thumbnail: String,
        options: [String],
        quantity: Number,
        cost: Number,
        SKU: String,
        product_id: String,
        sub_product_id: String,
        slug: String,
        reviewed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    promotion: {
      type: {
        promotionType: String,
        value: String,
        code: String,
      },
    },
    shippingAddress: {
      type: {
        name: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
      },
      required: true,
    },
    totalPrice: Number,
    status: {
      type: String,
      default: "pending", //pending, confirmed, shipping, delivered, canceled
    },
    orderNo: {
      type: String,
      index: true,
      unique: true,
    },
    cancel: {
      type: {
        reasonCancel: String,
        canceledBy: String,
        canceledAt: Date,
      },
    },
    estimatedDelivery: Date,
    deliveredAt: Date,
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: Number,
      default: 0, // 0 unpaid, 1 paid
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", schema, "orders");

export default Order;
