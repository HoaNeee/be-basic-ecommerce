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
      required: false, // Optional for socials login
    },
    avatar: String,
    phone: String,
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    providerId: String,
    social: {
      type: {
        google: Boolean,
      },
      default: {
        google: false,
      },
    },

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
