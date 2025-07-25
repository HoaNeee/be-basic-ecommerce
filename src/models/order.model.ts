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
        name: String,
        address: String,
        phone: String,
      },
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
    paymentMethod: String,
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
