import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isSent: { type: Boolean, default: false },
  subscribedAt: { type: Date, default: Date.now },
});

const Subscriber = mongoose.model("Subscriber", schema, "subscribers");

export default Subscriber;
