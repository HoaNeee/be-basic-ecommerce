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
Object.defineProperty(exports, "__esModule", { value: true });
exports.solvePriceStock = void 0;
const solvePriceStock = (product, subProducts) => __awaiter(void 0, void 0, void 0, function* () {
    let min = Infinity, max = 0, stock = 0;
    for (const sub of subProducts) {
        stock += sub.stock;
        min = Math.min(min, sub.price);
        max = Math.max(max, sub.price);
    }
    product[`rangePrice`] = {
        min: min,
        max: max,
    };
    product[`rangeStock`] = stock;
});
exports.solvePriceStock = solvePriceStock;
