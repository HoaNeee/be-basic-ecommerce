"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    type_sync: {
        type: String,
        enum: ["product", "blog"],
    },
    sync_time: {
        type: Date,
        default: Date.now,
    },
});
const SyncEmbedTime = mongoose_1.default.model("SyncEmbedTime", schema, "sync_embed_time");
exports.default = SyncEmbedTime;
