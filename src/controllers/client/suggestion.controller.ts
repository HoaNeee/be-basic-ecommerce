import { Router, Request, Response } from "express";
import Product from "../../models/product.model";
import SubProduct from "../../models/subProduct.model";
import { solvePriceStock } from "../../../utils/product";

// [POST] /suggestions/track
export const trackSuggestion = async function (req: Request, res: Response) {
  try {
    const action = req.body.action;
    const value = req.body.value;
    const type_track = req.body.type_track;

    const last_tracked_list = req.session["last_tracked_list"] || [];
    last_tracked_list.push({ action, value, type_track });
    req.session["last_tracked_list"] = last_tracked_list;

    res.json({ code: 200, message: "Suggestion tracked successfully" });
  } catch (error) {
    console.error("Error tracking suggestion:", error);
    res.json({ code: 500, message: "Internal server error" });
  }
};

// [GET] /suggestions
export const getTrackedList = async function (req: Request, res: Response) {
  try {
    const last_tracked_list = req.session["last_tracked_list"] || [];

    const last_tracked = last_tracked_list[last_tracked_list.length - 1];
    if (last_tracked) {
      if (last_tracked.type_track === "product") {
        const product = await Product.findOne({
          _id: last_tracked.value,
          deleted: false,
        }).lean();
        if (product && product.productType === "variations") {
          const subProducts = await SubProduct.find({
            product_id: product._id,
            deleted: false,
          }).lean();
          if (subProducts && subProducts.length > 0) {
            solvePriceStock(product, subProducts);
          }
        }
        const list_suggestion = [
          {
            title: `Tôi muốn xem chi tiết sản phẩm "${product?.title}"`,
            value: `Tôi muốn xem chi tiết sản phẩm "${product?.title}" có mã "${product?.slug}"`,
          },
          {
            title: `Tôi muốn tìm sản phẩm tương tự "${product?.title}"`,
            value: `Tôi muốn tìm sản phẩm tương tự "${product?.title}" có mã "${product?.slug}"`,
          },
          {
            title: `Tôi muốn biết số lượng còn lại của sản phẩm "${product?.title}"`,
            value: `Tôi muốn biết số lượng còn lại của sản phẩm "${product?.title}" có mã "${product?.slug}"`,
          },
        ];
        res.json({
          code: 200,
          message: "Success",
          data: {
            data: product,
            data_type: "product",
            suggestions: list_suggestion,
          },
        });
        return;
      }
    }

    const list_suggestion_default = [
      {
        title:
          "Tôi muốn tìm một chiếc áo sơ mi, bạn có thể gợi ý cho tôi không?",
        value:
          "Tôi muốn tìm một chiếc áo sơ mi, bạn có thể gợi ý cho tôi không?",
      },
      {
        title:
          "Tôi đang chưa có giày để đi, bạn có thể giúp tôi tìm một đôi giày phù hợp không?",
        value:
          "Tôi đang chưa có giày để đi, bạn có thể giúp tôi tìm một đôi giày phù hợp không?",
      },
      {
        title:
          "Tôi muốn mua một chiếc túi xách mới, bạn có thể gợi ý cho tôi một số mẫu không?",
        value:
          "Tôi muốn mua một chiếc túi xách mới, bạn có thể gợi ý cho tôi một số mẫu không?",
      },
    ];

    res.json({
      code: 200,
      message: "Success",
      data: {
        data: null,
        suggestions: list_suggestion_default,
      },
    });
  } catch (error) {
    console.error("Error getting tracked list:", error);
    res.json({ code: 500, message: "Internal server error" });
  }
};
