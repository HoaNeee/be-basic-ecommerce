import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    name: String,
    phone: String,
    houseNo: String,
    city: {
      title: String,
      value: String,
    },
    district: {
      title: String,
      value: String,
    },
    ward: {
      title: String,
      value: String,
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

const Address = mongoose.model("Address", schema, "address");

export default Address;
