"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
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
}, {
    timestamps: true,
});
schema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
const ForgotPassword = mongoose_1.default.model("ForgotPassword", schema, "forgot-passwords");
exports.default = ForgotPassword;
