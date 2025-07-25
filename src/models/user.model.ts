import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    password: String,
    role: {
      type: String,
      default: "admin",
    },
    avatar: String,
    social: String,
    status: String,
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema, "users");

export default User;
