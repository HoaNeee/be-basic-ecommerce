import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiredAt: {
      type: Date,
      default: () => new Date(Date.now() + 3 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

schema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

const ForgotPassword = mongoose.model(
  "ForgotPassword",
  schema,
  "forgot-passwords"
);

export default ForgotPassword;
