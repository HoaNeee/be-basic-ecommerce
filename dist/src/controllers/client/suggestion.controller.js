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
const subProduct_model_1 = __importDefault(require("../../models/subProduct.model"));
const product_1 = require("../../../utils/product");
const MAX_TRACKED_ITEMS = 50;
const TRACK_TYPES = {
    PRODUCT: "product",
    BLOG: "blog",
    OTHER: "other",
};
const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    INTERNAL_ERROR: 500,
};
const trackSuggestion = (req, res) => {
    try {
        const { action, value, type_track } = req.body;
        const last_tracked_list = req.session["last_tracked_list"] || [];
        const trackedItem = {
            action,
            value,
            type_track: type_track,
            timestamp: new Date(),
        };
        last_tracked_list.push(trackedItem);
        if (last_tracked_list.length > MAX_TRACKED_ITEMS) {
            last_tracked_list.shift();
        }
        req.session["last_tracked_list"] = last_tracked_list;
        const response = {
            code: HTTP_STATUS.OK,
            message: "Suggestion tracked successfully",
        };
        res.status(HTTP_STATUS.OK).json(response);
    }
    catch (error) {
        console.error("Error tracking suggestion:", error);
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            code: HTTP_STATUS.INTERNAL_ERROR,
            message: "Internal server error",
        });
    }
};
exports.trackSuggestion = trackSuggestion;
const getTrackedList = function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const last_tracked_list = req.session["last_tracked_list"] || [];
            const last_tracked = last_tracked_list[last_tracked_list.length - 1];
            console.log(last_tracked);
            if (last_tracked && last_tracked.type_track === TRACK_TYPES.PRODUCT) {
                const product = yield getProductWithVariations(last_tracked.value);
                if (product) {
                    const suggestions = getProductSuggestions(product);
                    const response = {
                        code: HTTP_STATUS.OK,
                        message: "Suggestions Success",
                        data: {
                            data: product,
                            data_type: "product",
                            suggestions: suggestions,
                        },
                    };
                    res.status(HTTP_STATUS.OK).json(response);
                    return;
                }
            }
            const defaultSuggestions = getDefaultSuggestions();
            const response = {
                code: HTTP_STATUS.OK,
                message: "Success",
                data: {
                    data: null,
                    suggestions: defaultSuggestions,
                },
            };
            res.status(HTTP_STATUS.OK).json(response);
        }
        catch (error) {
            console.error("Error getting tracked list:", error);
            res.status(HTTP_STATUS.INTERNAL_ERROR).json({
                code: HTTP_STATUS.INTERNAL_ERROR,
                message: "Internal server error",
            });
        }
    });
};
exports.getTrackedList = getTrackedList;
const getProductSuggestions = (product) => {
    if (!product)
        return [];
    return [
        {
            title: `Tôi muốn xem chi tiết sản phẩm '${product.title}'`,
            value: `Tôi muốn xem chi tiết sản phẩm '${product.title}' có mã '${product.slug}'`,
            type: "product_detail",
            priority: 1,
        },
        {
            title: `Tôi muốn tìm sản phẩm tương tự '${product.title}'`,
            value: `Tôi muốn tìm sản phẩm tương tự '${product.title}' có mã '${product.slug}'`,
            type: "similar_product",
            priority: 2,
        },
        {
            title: `Tôi muốn biết số lượng còn lại của sản phẩm '${product.title}'`,
            value: `Tôi muốn biết số lượng còn lại của sản phẩm '${product.title}' có mã '${product.slug}'`,
            type: "stock_check",
            priority: 3,
        },
    ];
};
const getDefaultSuggestions = () => {
    return [
        {
            title: "Tôi muốn tìm một chiếc áo sơ mi, bạn có thể gợi ý cho tôi không?",
            value: "Tôi muốn tìm một chiếc áo sơ mi, bạn có thể gợi ý cho tôi không?",
            type: "search_product",
            priority: 1,
        },
        {
            title: "Tôi đang chưa có giày để đi, bạn có thể giúp tôi tìm một đôi giày phù hợp không?",
            value: "Tôi đang chưa có giày để đi, bạn có thể giúp tôi tìm một đôi giày phù hợp không?",
            type: "search_product",
            priority: 2,
        },
        {
            title: "Tôi muốn mua một chiếc túi xách mới, bạn có thể gợi ý cho tôi một số mẫu không?",
            value: "Tôi muốn mua một chiếc túi xách mới, bạn có thể gợi ý cho tôi một số mẫu không?",
            type: "search_product",
            priority: 3,
        },
    ];
};
const getProductWithVariations = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findOne({
        _id: productId,
        deleted: false,
    }).lean();
    if (!product)
        return null;
    if (product.productType === "variations") {
        const subProducts = yield subProduct_model_1.default.find({
            product_id: product._id,
            deleted: false,
        }).lean();
        if (subProducts && subProducts.length > 0) {
            (0, product_1.solvePriceStock)(product, subProducts);
        }
    }
    return product;
});
