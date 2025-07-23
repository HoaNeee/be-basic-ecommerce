import { Request, Response } from "express";
import * as dateHelper from "../../../helpers/getDate";
import Order from "../../models/order.model";
import PurchaseOrder from "../../models/purchaseOrder.model";
import SubProduct from "../../models/subProduct.model";
import Product from "../../models/product.model";
import Category from "../../models/category.model";
import Pagination from "../../../helpers/pagination";
import { skip } from "node:test";
import { getDataChartHelper } from "./purchase.controller";
import { groupByArray } from "../../../helpers/groupBy";

// [GET] /reports/overview
export const getDataReport = async (req: Request, res: Response) => {
  try {
    const [startMonth, endMonth] = dateHelper.getStartEnd("month");
    const [startYear, endYear] = dateHelper.getStartEnd("year");

    const orders = await Order.find({ deleted: false });
    const po = await PurchaseOrder.find({ deleted: false });

    const cost = po.reduce((val, item) => {
      return val + item.totalCost;
    }, 0);

    const revenue = orders.reduce((val, item) => {
      return val + item.totalPrice;
    }, 0);

    const profit = revenue - cost;

    const findMonth = {
      deleted: false,
      createdAt: { $gte: startMonth, $lt: endMonth },
    };
    const findYear = {
      deleted: false,
      createdAt: { $gte: startYear, $lt: endYear },
    };

    const promises = await Promise.all([
      await Order.find(findMonth),
      await PurchaseOrder.find(findMonth),
      await Order.find(findYear),
      await PurchaseOrder.find(findYear),
    ]);

    const [ordersOfMonth, poOfMonth, ordersOfYear, poOfYear] = promises;

    const profitOfMonth =
      ordersOfMonth.reduce((val, item) => val + item.totalPrice, 0) -
      poOfMonth.reduce((val, item) => val + item.totalCost, 0);
    const profitOfYear =
      ordersOfYear.reduce((val, item) => val + item.totalPrice, 0) -
      poOfYear.reduce((val, item) => val + item.totalCost, 0);

    res.json({
      code: 200,
      message: "OK",
      data: {
        totalProfit: profit,
        cost,
        revenue,
        sales: orders.length,
        profitOfMonth,
        profitOfYear,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

const paginationHelper = (
  data: any[],
  req: Request,
  totalRecord: number,
  initLimit?: number
) => {
  const initPagination = {
    page: 1,
    limitItems: initLimit || totalRecord,
  };

  if (req.query.limit) {
    initPagination.limitItems = Number(req.query.limit);
  }

  const objPagination = Pagination(initPagination, req.query, totalRecord);
  const skip = objPagination.skip;

  const res = [];

  for (
    let i = skip;
    i < Math.min(totalRecord, skip + objPagination.limitItems);
    i++
  ) {
    res.push(data[i]);
  }

  return res;
};

// [GET] /reports/top-sell-categories
export const getCategoryTopSell = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ deleted: false });
    const skus = [];

    const priceMap = new Map();
    for (const order of orders) {
      const products = order.products;
      for (const product of products) {
        skus.push(product.SKU);
        priceMap.set(
          product.SKU,
          priceMap.get(product.SKU) + product.price || product.price
        );
      }
    }

    const qtyMap = new Map();

    for (const sku of skus) {
      qtyMap.set(sku, qtyMap.get(sku) + 1 || 1);
    }

    const subProducts = await SubProduct.find({
      deleted: false,
      SKU: { $in: skus },
    });
    const idsProduct = subProducts.map((item) => item.product_id);

    const subMap = groupByArray(subProducts, "product_id");

    const products = await Product.find({
      deleted: false,
      $or: [{ SKU: { $in: skus } }, { _id: { $in: idsProduct } }],
    });

    const catsMap = new Map();

    for (const product of products) {
      let curr_quantiy = 0;
      let curr_totalPrice = 0;
      if (product.productType === "variations") {
        const subs = subMap.get(product.id);
        for (const sub of subs) {
          const qty = qtyMap.get(sub.SKU) || 0;
          const price = priceMap.get(sub.SKU) || 0;
          curr_quantiy += qty;
          curr_totalPrice += price;
        }
      } else {
        const qty = qtyMap.get(product.SKU) || 0;
        const price = priceMap.get(product.SKU) || 0;
        curr_quantiy += qty;
        curr_totalPrice += price;
      }
      const cateIds = product.categories;
      for (const cat_id of cateIds) {
        if (!catsMap.has(cat_id)) {
          catsMap.set(cat_id, {
            quantity: curr_quantiy,
            totalPrice: curr_totalPrice,
          });
        } else {
          let { quantity, totalPrice } = catsMap.get(cat_id);
          quantity += curr_quantiy;
          totalPrice += curr_totalPrice;
          catsMap.set(cat_id, { quantity, totalPrice });
        }
      }
    }

    const categories = await Category.find({
      deleted: false,
      _id: { $in: [...catsMap.keys()] },
    });

    let data = [];

    for (const cate of categories) {
      const { quantity, totalPrice } = catsMap.get(cate.id);
      data.push({
        ...cate.toObject(),
        quantity,
        totalPrice,
      });
    }

    data = [...data.sort((a, b) => b.quantity - a.quantity)];

    if (!req.query.page && !req.query.limit) {
      res.json({
        code: 200,
        message: "OK",
        data,
      });
      return;
    }
    const totalRecord = data.length;

    const response = paginationHelper(data, req, totalRecord, 4);

    res.json({
      code: 200,
      message: "OK",
      data: response,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
