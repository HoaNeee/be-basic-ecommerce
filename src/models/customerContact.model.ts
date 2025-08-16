import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  message: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  replyMessage: { type: String },
  status: {
    type: String,
    enum: ["pending", "responded", "resolved"],
    default: "pending",
  },
});

const CustomerContact = mongoose.model(
  "CustomerContact",
  schema,
  "customer-contacts"
);

export default CustomerContact;
