import { Request, Response } from "express";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Bill from "../../models/order.model";
import Product from "../../models/product.model";
import SubProduct from "../../models/subProduct.model";
import Favorite from "../../models/favorite.model";
import Supplier from "../../models/supplier.model";
import { solvePriceStock } from "../../../utils/product";
import Pagination from "../../../helpers/pagination";

// [GET] /favorites
export const index = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const list = await Favorite.findOne({ user_id: user_id, deleted: false });

    res.json({
      code: 200,
      message: "OK",
      data: {
        list,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [GET] /favorites/info
export const getListFavoriteInfo = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const list = await Favorite.findOne({ user_id: user_id, deleted: false });

    if (!list) {
      res.json({
        code: 200,
        message: "OK",
        data: {
          products: [],
        },
      });
      return;
    }

    const product_ids = list.products;

    const totalRecord = await Product.countDocuments({
      _id: { $in: product_ids },
      deleted: false,
    });

    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(initPagination, req.query, totalRecord);

    const products = await Product.find({
      _id: { $in: product_ids },
      deleted: false,
    })
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems)
      .lean();

    const subProducts = await SubProduct.find({
      product_id: { $in: product_ids },
      deleted: false,
    });

    for (const product of products) {
      if (product.productType === "variations") {
        const subs = subProducts.filter(
          (sub) => sub.product_id === String(product._id)
        );
        solvePriceStock(product, subs);
      }
      const supplier = await Supplier.findOne({ _id: product.supplier_id });
      if (supplier) {
        product["supplierName"] = supplier.name;
      }
    }

    res.json({
      code: 200,
      message: "Favorite OK!",
      data: {
        products,
        totalRecord,
        totalPage: objectPagination.totalPage,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /favorites/add
export const addProduct = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const list = body.listFavorite;

    const favorite = await Favorite.findOne({ user_id: user_id });

    if (!favorite) {
      const newFavorite = new Favorite({
        products: list,
        user_id: user_id,
      });

      await newFavorite.save();
    } else {
      favorite.products = [...list];
      await favorite.save();
    }

    res.json({
      code: 200,
      message: "Added!",
      data: {},
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [DELETE] /favorites/remove/:product_id
export const removeProduct = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const product_id = req.params.product_id;

    if (!product_id) {
      throw Error("Missing product_id");
    }

    const favorite = await Favorite.findOne({ user_id: user_id });

    if (!favorite) {
      throw Error("Not found!");
    }

    favorite.products = [
      ...favorite.products.filter((item) => item !== product_id),
    ];

    await favorite.save();

    res.json({
      code: 200,
      message: "Removed!",
      data: {},
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
