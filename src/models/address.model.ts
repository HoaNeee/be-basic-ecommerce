import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    houseNo: {
      type: String,
      required: true,
    },
    city: {
      title: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
    district: {
      title: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
    ward: {
      title: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: String,
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", schema, "address");

export default Address;
