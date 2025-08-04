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
exports.getTrackedList = exports.trackSuggestion = void 0;
const product_model_1 = __importDefault(require("../../models/product.model"));
const trackSuggestion = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const action = req.body.action;
            const value = req.body.value;
            const type_track = req.body.type_track;
            const last_tracked_list = req.session["last_tracked_list"] || [];
            last_tracked_list.push({ action, value, type_track });
            req.session["last_tracked_list"] = last_tracked_list;
            res.json({ code: 200, message: "Suggestion tracked successfully" });
        }
        catch (error) {
            console.error("Error tracking suggestion:", error);
            res.json({ code: 500, message: "Internal server error" });
        }
    });
};
exports.trackSuggestion = trackSuggestion;
const getTrackedList = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const last_tracked_list = req.session["last_tracked_list"] || [];
            const last_tracked = last_tracked_list[last_tracked_list.length - 1];
            if (last_tracked) {
                if (last_tracked.type_track === "product") {
                    const product = yield product_model_1.default.findOne({
                        _id: last_tracked.value,
                        deleted: false,
                    });
                    const list_suggestion = [
                        {
                            title: `Bạn có muốn xem chi tiết sản phẩm "${product === null || product === void 0 ? void 0 : product.title}" không?`,
                            value: `Tôi muốn xem chi tiết sản phẩm "${product === null || product === void 0 ? void 0 : product.slug}"`,
                        },
                        {
                            title: `Sản phẩm "${product === null || product === void 0 ? void 0 : product.title}" có phải là bạn đang tìm kiếm?`,
                            value: `Tôi muốn tìm sản phẩm "${product === null || product === void 0 ? void 0 : product.title}"`,
                        },
                        {
                            title: `Bạn có muốn biết thêm thông tin về sản phẩm "${product === null || product === void 0 ? void 0 : product.title}" không?`,
                            value: `Tôi muốn biết thêm thông tin về sản phẩm "${product === null || product === void 0 ? void 0 : product.title}"`,
                        },
                    ];
                    res.json({
                        code: 200,
                        message: "Success",
                        data: {
                            data: product,
                            suggestions: list_suggestion,
                        },
                    });
                    return;
                }
            }
            const list_suggestion_default = [
                {
                    title: "Tôi muốn tìm một chiếc áo sơ mi, bạn có thể gợi ý cho tôi không?",
                    value: "Tôi muốn tìm một chiếc áo sơ mi, bạn có thể gợi ý cho tôi không?",
                },
                {
                    title: "Tôi đang chưa có giày để đi, bạn có thể giúp tôi tìm một đôi giày phù hợp không?",
                    value: "Tôi đang chưa có giày để đi, bạn có thể giúp tôi tìm một đôi giày phù hợp không?",
                },
                {
                    title: "Tôi muốn mua một chiếc túi xách mới, bạn có thể gợi ý cho tôi một số mẫu không?",
                    value: "Tôi muốn mua một chiếc túi xách mới, bạn có thể gợi ý cho tôi một số mẫu không?",
                },
            ];
            res.json({
                code: 200,
                message: "Success",
                data: {
                    data: {},
                    suggestions: list_suggestion_default,
                },
            });
        }
        catch (error) {
            console.error("Error getting tracked list:", error);
            res.json({ code: 500, message: "Internal server error" });
        }
    });
};
exports.getTrackedList = getTrackedList;
