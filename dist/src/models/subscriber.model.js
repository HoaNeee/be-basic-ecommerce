"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ["sent", "not-sent", "cancel"],
        default: "not-sent",
    },
    subscribedAt: { type: Date, default: Date.now },
});
const Subscriber = mongoose_1.default.model("Subscriber", schema, "subscribers");
exports.default = Subscriber;
