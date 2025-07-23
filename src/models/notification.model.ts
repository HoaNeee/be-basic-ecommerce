import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    user_id: {
      type: String,
    },
    type: {
      type: String,
      enum: ["order", "profile"],
    },
    title: String,
    body: String,
    ref_id: String,
    ref_link: String,
    image: String,
    receiver: String,
    isRead: {
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

const Notification = mongoose.model("Notification", schema, "notifications");

export default Notification;
