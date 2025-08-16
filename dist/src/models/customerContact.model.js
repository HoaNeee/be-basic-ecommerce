"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
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
const CustomerContact = mongoose_1.default.model("CustomerContact", schema, "customer-contacts");
exports.default = CustomerContact;
