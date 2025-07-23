import { Request, Response } from "express";
import PurchaseOrder from "../../models/purchaseOrder.model";
import Product from "../../models/product.model";
import SubProduct from "../../models/subProduct.model";
import Pagination from "../../../helpers/pagination";
import * as dateHelper from "../../../helpers/getDate";
import { Model } from "mongoose";

export const getDataChartHelper = async (
  type: string,
  day: number,
  maxDay: number,
  name: string,
  Record?: Model<any>,
  keyCost?: string,
  thisYear?: number
) => {
  const oneDay = 1000 * 60 * 60 * 24;

  const response = [];

  thisYear = thisYear || new Date().getFullYear();

  if (type === "year") {
    for (let i = day; i <= maxDay; i++) {
      const start = new Date(
        new Date(`${i}/1/${thisYear}`).setUTCHours(0, 0, 0, 0)
      );
      const end = new Date(
        new Date(`${i}/${dateHelper.dateOfMonth(i)}/${thisYear}`).setUTCHours(
          0,
          0,
          0,
          0
        )
      );

      const newStart = new Date(start.setDate(start.getDate() + 1));
      const newEnd = new Date(end.getTime() + oneDay * 2);
      const records = await Record.find({
        $and: [
          { deleted: false },
          { createdAt: { $gte: newStart } },
          { createdAt: { $lt: newEnd } },
        ],
      });
      const total = records.reduce((val, item) => {
        return (
          val +
          item.products.reduce(
            (val1: number, it: any) => val1 + it[`${keyCost}`] * it.quantity,
            0
          )
        );
      }, 0);

      response.push({
        name: name,
        label: dateHelper.monthOfTheYear(i - 1, "short"),
        value: total,
      });
    }

    return response;
  }

  const dates = [];

  for (let i = day - 1; i >= 0; i--) {
    const date = new Date(
      new Date(new Date().getTime() - oneDay * i).setUTCHours(0, 0, 0, 0)
    );

    dates.push(date);
  }

  const endDate = new Date(dates[dates.length - 1].getTime() + oneDay);

  const records = await Record.find({
    $and: [{ createdAt: { $gte: dates[0] } }, { createdAt: { $lt: endDate } }],
  }).sort({ createAt: "asc" });

  const ordersMap = new Map();

  for (const rec of records) {
    const date = new Date(rec.createdAt).toLocaleDateString();
    const total = rec.products.reduce(
      (val: number, item: any) => val + item.quantity * item[`${keyCost}`],
      0
    );
    if (ordersMap.has(date)) {
      ordersMap.set(date, ordersMap.get(date) + total);
    } else {
      ordersMap.set(date, total);
    }
  }

  for (let i = 0; i < day; i++) {
    const date = dates[i];
    const total = ordersMap.get(date.toLocaleDateString()) || 0;

    response.push({
      name: name,
      label:
        type === "weekly"
          ? dateHelper.dayOfTheWeek(i, "short")
          : date.toLocaleDateString(),
      value: total,
    });
  }

  for (let i = day; i < maxDay; i++) {
    const nextDate = new Date(dates[0].getTime() + oneDay * i);
    response.push({
      name: name,
      label:
        type === "weekly"
          ? dateHelper.dayOfTheWeek(i, "short")
          : nextDate.toLocaleDateString(),
      value: 0,
    });
  }

  return response;
};

// [GET] /purchase-orders
export const index = async (req: Request, res: Response) => {
  try {
    let find = {
      deleted: false,
    };

    const totalRecord = await PurchaseOrder.countDocuments(find);

    const initialPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initialPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(
      initialPagination,
      req.query,
      totalRecord
    );

    const pos = await PurchaseOrder.find(find)
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems)
      .lean();

    const productsSKU = pos.map((item) => {
      return item.products.map((it) => it.SKU);
    });

    const flatArr = productsSKU.flat();

    const subProducts = await SubProduct.find({
      SKU: { $in: flatArr },
      deleted: false,
    });

    const productIds = subProducts.map((item) => item.product_id);

    const products = await Product.find({
      $and: [
        {
          $or: [{ _id: { $in: productIds } }, { SKU: { $in: flatArr } }],
        },
        { deleted: false },
      ],
    })
      .select("title SKU price")
      .lean();

    for (const po of pos) {
      const templateProduct = products.find((item) => {
        const it = po.products.find((i) => i.SKU === item.SKU);

        return it;
      });

      if (templateProduct) {
        po["templateProduct"] = templateProduct;
      } else {
        const sub = subProducts.find((item) => {
          const it = po.products.find((i) => i.SKU === item.SKU);

          if (it) {
            return item;
          }
        });

        if (sub) {
          const product = products.find(
            (item) => String(item._id) === sub.product_id
          );
          if (product) {
            po["templateProduct"] = product;
          }
        }
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        purchase_orders: pos,
        totalRecord: totalRecord,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [POST] /purchase-orders/create
export const create = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const po = new PurchaseOrder(body);

    po.totalCost = po.products.reduce(
      (val, item) => val + item.quantity * item.unitCost,
      0
    );

    await po.save();

    res.json({
      code: 200,
      message: "Created success!",
      data: po,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [PATCH] /purchase-orders/change-status/:id
export const changeStatus = async (req: Request, res: Response) => {
  try {
    const po_id = req.params.id;
    const { status } = req.body;

    if (!po_id) {
      throw Error("Missing _id");
    }

    if (status === "received") {
      const po = await PurchaseOrder.findOne({ _id: po_id, deleted: false });

      const productsSKU = po.products;

      const skus = productsSKU.map((item) => item.SKU);

      const products = await Product.find({
        SKU: { $in: skus },
        deleted: false,
      });

      const subProducts = await SubProduct.find({
        SKU: { $in: skus },
        deleted: false,
      });

      for (const item of productsSKU) {
        const quantity = item.quantity;
        const cost = item.unitCost;
        const product = products.find((it) => it.SKU === item.SKU);
        const subProduct = subProducts.find((it) => it.SKU === item.SKU);

        if (product) {
          product.stock += quantity;
          product.cost = cost;
          await product.save();
        } else if (subProduct) {
          subProduct.stock += quantity;
          subProduct.cost = cost;
          await subProduct.save();
        }
      }

      const receivedAt = new Date();

      po.receivedAt = receivedAt;
      po.status = status;
      await po.save();

      res.json({
        code: 200,
        message: "Success!",
      });
      return;
    }

    await PurchaseOrder.updateOne(
      { _id: po_id },
      {
        status: status,
      }
    );

    res.json({
      code: 200,
      message: "Success!",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [GET] /purchase-orders/statistic
export const statistic = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    let find: any = {
      deleted: false,
    };

    if (from && to) {
      find = {
        $and: [
          { ...find },
          { createdAt: { $gte: from } },
          { createdAt: { $lte: to } },
        ],
      };
    }

    const pos = await PurchaseOrder.find(find);

    const received = pos.filter((item) => item.status === "received");
    const canceled = pos.filter((item) => item.status === "canceled");
    const delivering = pos.filter((item) => item.status === "delivering");

    res.json({
      code: 200,
      message: "OK",
      data: {
        totalOrders: pos,
        received,
        canceled,
        delivering,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [GET] /purchase-orders/chart
export const getDataChart = async (req: Request, res: Response) => {
  try {
    /**
     * name
     * day / month -> label
     * total -> value
     */

    const type = req.query.type;

    let data = [];

    if (type === "weekly") {
      const dayOfTheWeek = new Date().getDay();

      const response = await getDataChartHelper(
        type,
        dayOfTheWeek,
        7,
        "purchase",
        PurchaseOrder,
        "unitCost"
      );

      data = [...response];
    } else if (type === "monthly") {
      const thisMonth = new Date().getMonth();
      const dateOfMonth = dateHelper.dateOfMonth(thisMonth + 1);
      const dayOfTheMonth = new Date().getDate();

      const response = await getDataChartHelper(
        type,
        dayOfTheMonth,
        dateOfMonth,
        "purchase",
        PurchaseOrder,
        "unitCost"
      );

      data = [...response];
    } else {
      const response = await getDataChartHelper(
        "year",
        1,
        12,
        "purchase",
        PurchaseOrder,
        "unitCost"
      );
      data = [...response];
    }

    res.json({
      code: 200,
      message: "OK",
      data: data,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
