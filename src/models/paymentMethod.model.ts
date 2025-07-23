import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    cardNumber: {
      type: String,
      required: true,
    },
    cardName: {
      type: String,
      required: true,
    },
    CVV: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      default: "credit",
    },
    isDefault: Boolean,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", schema, "payments");

export default Payment;
