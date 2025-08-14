"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
    product_id: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["delete", "update"],
    },
}, { timestamps: true });
const EmbedProduct = mongoose_1.default.model("EmbedProduct", schema, "embed-products");
exports.default = EmbedProduct;
