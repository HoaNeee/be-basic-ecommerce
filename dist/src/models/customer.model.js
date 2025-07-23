"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    firstName: String,
    lastName: String,
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: String,
    phone: String,
    status: {
        type: String,
        default: "active",
    },
    setting: {
        notification: {
            type: Boolean,
            default: true,
        },
        emailNotification: {
            type: Boolean,
            default: true,
        },
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
}, { timestamps: true });
const Customer = mongoose_1.default.model("Customer", schema, "customers");
exports.default = Customer;
