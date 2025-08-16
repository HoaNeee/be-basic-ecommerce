import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["sent", "not-sent", "cancel"],
    default: "not-sent",
  },
  subscribedAt: { type: Date, default: Date.now },
});

const Subscriber = mongoose.model("Subscriber", schema, "subscribers");

export default Subscriber;
