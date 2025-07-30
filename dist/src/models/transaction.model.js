"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    user_id: {
        type: String,
        required: true,
    },
    cart_items: [],
    transaction_info: {
        type: {
            address: Object,
            payment: {
                method: String,
                status: {
                    type: String,
                    enum: ["pending", "completed", "canceled"],
                },
            },
        },
    },
    current_step: {
        type: String,
        default: "1",
    },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "canceled"],
        default: "pending",
    },
    expireAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 * 12 * 1000),
    },
}, { timestamps: true });
schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
const Transaction = mongoose_1.default.model("Transaction", schema);
exports.default = Transaction;
