"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    text_hash: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    query: {
        type: Object,
    },
    response: {
        type: [String],
    },
    expireAt: {
        type: Date,
        default: Date.now,
        expires: 3600 * 24,
    },
}, { timestamps: true });
const TextCache = mongoose_1.default.model("TextCache", schema, "text-caches");
exports.default = TextCache;
