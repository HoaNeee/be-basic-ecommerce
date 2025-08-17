import { Request, Response } from "express";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Transaction from "../../models/transaction.model";
import CartDetail from "../../models/cartDetail.model";
import Product from "../../models/product.model";
import SubProduct from "../../models/subProduct.model";
import VariationOption from "../../models/variationOption.model";

// [POST] /transaction/start
export const startTransaction = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const existingTransaction = await Transaction.findOne({
      user_id,
      status: "processing",
    });

    if (existingTransaction) {
      res.json({
        code: 400,
        message:
          "You already have an ongoing transaction, please complete or cancel it first.",
      });
      return;
    }

    const body = req.body;
    const transaction = new Transaction({
      user_id,
      status: "processing",
      ...body,
    });

    await transaction.save();

    res.json({
      code: 200,
      message: "Transaction started!",
      data: transaction,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /transaction/change
export const transactionChange = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;
    const action = req.query.action as string;

    if (action === "complete") {
      return transactionComplete(req, res);
    }

    if (action === "cancel") {
      return transactionCancel(req, res);
    }

    const { step, payload } = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      {
        user_id,
        status: "processing",
      },
      {
        $set: {
          current_step: step,
          transaction_info: payload,
        },
      }
    );

    if (!transaction) {
      res.json({
        code: 404,
        message: "Transaction not found or already completed.",
      });
      return;
    }

    res.json({
      code: 200,
      message: "Transaction updated!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [GET] /transaction/detail
export const transactionDetail = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;
    const transaction = await Transaction.findOne({
      user_id,
      status: "processing",
    }).lean();

    if (transaction) {
      const cart_ids = transaction.cart_items;
      const cart_items_info = await CartDetail.find({
        _id: { $in: cart_ids },
      }).lean();
      const productIds = cart_items_info.map((item) => item.product_id);
      const subIds = cart_items_info.map((item) => item.sub_product_id);

      const products = await Product.find({
        _id: { $in: productIds },
        deleted: false,
      });
      const subProducts = await SubProduct.find({
        _id: { $in: subIds },
        deleted: false,
      });

      for (const item of cart_items_info) {
        const indexProduct = products.findIndex(
          (pro) => pro.id === item.product_id
        );
        item["cartItem_id"] = item._id;
        if (indexProduct !== -1) {
          item["thumbnail"] = products[indexProduct].thumbnail;
          item["title"] = products[indexProduct].title;
          item["slug"] = products[indexProduct].slug;
          item["cost"] = products[indexProduct].cost;
        }
        if (item.options.length > 0) {
          const indexSub = subProducts.findIndex(
            (sub) => sub.id === item.sub_product_id
          );
          const options_info = [];
          for (const option_id of item.options) {
            const option = await VariationOption.findOne({ _id: option_id });
            if (option) {
              options_info.push({
                title: option.title,
                value: option.id,
                variation_id: option.variation_id,
              });
            }
          }
          item["options_info"] = [...options_info];

          if (indexSub !== -1) {
            item["thumbnail"] = subProducts[indexSub].thumbnail;
            item["price"] = subProducts[indexSub].price;
            item["discountedPrice"] = subProducts[indexSub].discountedPrice;
            item["stock"] = subProducts[indexSub].stock;
            item["cost"] = subProducts[indexSub].cost;
            item["SKU"] = subProducts[indexSub].SKU;
            item["thumbnail_product"] = subProducts[indexSub].thumbnail;
          }
        } else {
          item["price"] = products[indexProduct].price;
          item["discountedPrice"] = products[indexProduct].discountedPrice;
          item["stock"] = products[indexProduct].stock;
          item["SKU"] = products[indexProduct].SKU;
        }
        if (!item["SKU"]) {
          item["SKU"] = products[indexProduct].SKU;
        }
      }
      if (req.session["cart_checkout"]) {
        transaction["cart_items_info"] = req.session["cart_checkout"];
      } else {
        transaction["cart_items_info"] = cart_items_info;
      }
    }

    res.json({
      code: 200,
      message: "Transaction detail retrieved successfully.",
      data: transaction,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

const transactionCancel = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;
    const transaction = await Transaction.findOneAndUpdate(
      { user_id, status: "processing" },
      {
        $set: {
          status: "canceled",
        },
      }
    );
    if (!transaction) {
      res.json({
        code: 404,
        message: "Transaction not found or already completed.",
      });
      return;
    }
    res.json({
      code: 200,
      message: "Transaction canceled!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

const transactionComplete = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;
    const transaction = await Transaction.findOneAndUpdate(
      { user_id, status: "processing" },
      {
        $set: {
          status: "completed",
        },
      }
    );
    if (!transaction) {
      res.json({
        code: 404,
        message: "Transaction not found or already completed.",
      });
      return;
    }
    res.json({
      code: 200,
      message: "Transaction completed!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
