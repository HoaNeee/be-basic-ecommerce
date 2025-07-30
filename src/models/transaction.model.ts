import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    cart_items: [],
    transaction_info: {
      type: {
        address: Object,
        payment: {
          method: String,
          status: {
            type: String,
            enum: ["pending", "completed", "canceled"],
          },
        },
      },
    },
    current_step: {
      type: String,
      default: "1",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "canceled"],
      default: "pending",
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 12 * 1000), // 12 minutes from now
    },
  },
  { timestamps: true }
);

schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const Transaction = mongoose.model("Transaction", schema);

export default Transaction;
