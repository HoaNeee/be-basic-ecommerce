"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExist = void 0;
const cart_model_1 = __importDefault(require("../../models/cart.model"));
const isExist = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const cart = yield cart_model_1.default.findOne({ user_id: user_id }).select("-deleted -deletedAt");
        if (!cart) {
            throw new Error("Cart not found");
        }
        req.cartId = cart.id;
        next();
    }
    catch (error) {
        res.json({
            code: 404,
            message: error.message,
        });
    }
});
exports.isExist = isExist;
