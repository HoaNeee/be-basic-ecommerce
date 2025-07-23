import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: String,
    phone: String,
    // role: {
    //   type: String,
    //   default: "customer",
    // },
    status: {
      type: String,
      default: "active",
    },
    setting: {
      notification: {
        type: Boolean,
        default: true,
      },
      emailNotification: {
        type: Boolean,
        default: true,
      },
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", schema, "customers");

export default Customer;
