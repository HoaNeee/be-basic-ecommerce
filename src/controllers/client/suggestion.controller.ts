import { Request, Response } from "express";
import Product from "../../models/product.model";
import SubProduct from "../../models/subProduct.model";
import { solvePriceStock } from "../../../utils/product";
import {
  TrackedItem,
  SuggestionItem,
  SuggestionResponse,
  TrackSuggestionRequest,
} from "../../types/suggestion.types";

const MAX_TRACKED_ITEMS = 50;
const TRACK_TYPES = {
  PRODUCT: "product",
  BLOG: "blog",
  OTHER: "other",
} as const;

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_ERROR: 500,
} as const;

// [POST] /suggestions/track
export const trackSuggestion = (req: Request, res: Response) => {
  try {
    const { action, value, type_track }: TrackSuggestionRequest = req.body;

    const last_tracked_list: TrackedItem[] =
      req.session["last_tracked_list"] || [];

    const trackedItem: TrackedItem = {
      action,
      value,
      type_track: type_track as TrackedItem["type_track"],
      timestamp: new Date(),
    };

    last_tracked_list.push(trackedItem);

    if (last_tracked_list.length > MAX_TRACKED_ITEMS) {
      last_tracked_list.shift();
    }

    req.session["last_tracked_list"] = last_tracked_list;

    const response: SuggestionResponse = {
      code: HTTP_STATUS.OK,
      message: "Suggestion tracked successfully",
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    console.error("Error tracking suggestion:", error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      code: HTTP_STATUS.INTERNAL_ERROR,
      message: "Internal server error",
    });
  }
};

// [GET] /suggestions
export const getTrackedList = async function (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const last_tracked_list: TrackedItem[] =
      req.session["last_tracked_list"] || [];
    const last_tracked = last_tracked_list[last_tracked_list.length - 1];

    if (last_tracked && last_tracked.type_track === TRACK_TYPES.PRODUCT) {
      const product = await getProductWithVariations(last_tracked.value);

      if (product) {
        const suggestions = getProductSuggestions(product);

        const response: SuggestionResponse = {
          code: HTTP_STATUS.OK,
          message: "Success",
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
    const response: SuggestionResponse = {
      code: HTTP_STATUS.OK,
      message: "Success",
      data: {
        data: null,
        suggestions: defaultSuggestions,
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    console.error("Error getting tracked list:", error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      code: HTTP_STATUS.INTERNAL_ERROR,
      message: "Internal server error",
    });
  }
};

const getProductSuggestions = (product: any): SuggestionItem[] => {
  if (!product) return [];

  return [
    {
      title: `Tôi muốn xem chi tiết sản phẩm "${product.title}"`,
      value: `Tôi muốn xem chi tiết sản phẩm "${product.title}" có mã "${product.slug}"`,
      type: "product_detail",
      priority: 1,
    },
    {
      title: `Tôi muốn tìm sản phẩm tương tự "${product.title}"`,
      value: `Tôi muốn tìm sản phẩm tương tự "${product.title}" có mã "${product.slug}"`,
      type: "similar_product",
      priority: 2,
    },
    {
      title: `Tôi muốn biết số lượng còn lại của sản phẩm "${product.title}"`,
      value: `Tôi muốn biết số lượng còn lại của sản phẩm "${product.title}" có mã "${product.slug}"`,
      type: "stock_check",
      priority: 3,
    },
  ];
};

const getDefaultSuggestions = (): SuggestionItem[] => {
  return [
    {
      title: "Tôi muốn tìm một chiếc áo sơ mi, bạn có thể gợi ý cho tôi không?",
      value: "Tôi muốn tìm một chiếc áo sơ mi, bạn có thể gợi ý cho tôi không?",
      type: "search_product",
      priority: 1,
    },
    {
      title:
        "Tôi đang chưa có giày để đi, bạn có thể giúp tôi tìm một đôi giày phù hợp không?",
      value:
        "Tôi đang chưa có giày để đi, bạn có thể giúp tôi tìm một đôi giày phù hợp không?",
      type: "search_product",
      priority: 2,
    },
    {
      title:
        "Tôi muốn mua một chiếc túi xách mới, bạn có thể gợi ý cho tôi một số mẫu không?",
      value:
        "Tôi muốn mua một chiếc túi xách mới, bạn có thể gợi ý cho tôi một số mẫu không?",
      type: "search_product",
      priority: 3,
    },
  ];
};

const getProductWithVariations = async (productId: string) => {
  const product = await Product.findOne({
    _id: productId,
    deleted: false,
  }).lean();

  if (!product) return null;

  if (product.productType === "variations") {
    const subProducts = await SubProduct.find({
      product_id: product._id,
      deleted: false,
    }).lean();

    if (subProducts && subProducts.length > 0) {
      solvePriceStock(product, subProducts);
    }
  }

  return product;
};
