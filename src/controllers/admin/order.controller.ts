import { Request, Response } from "express";
import Pagination from "../../../helpers/pagination";
import Order from "../../models/order.model";
import Cart from "../../models/cart.model";
import CartDetail from "../../models/cartDetail.model";
import * as dateHelper from "../../../helpers/getDate";
import { getDataChartHelper } from "./purchase.controller";
import Customer from "../../models/customer.model";
import { MyRequest } from "../../middlewares/admin/auth.middleware";
import { statusOrder, updateStockWhenOrder } from "../../../utils/order";
import Notification from "../../models/notification.model";
import Product from "../../models/product.model";
import SubProduct from "../../models/subProduct.model";
import { getIo } from "../../../socket";

// [GET] /orders
export const orders = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: false,
    };

    let { keyword, status } = req.query;
    let from: any = req.query.from;
    let to: any = req.query.to;
    const sortQuery = req.query.sort as string;

    const sort = {};

    if (sortQuery) {
      const sorts = sortQuery.split("-");
      sort[`${sorts[0]}`] = sorts[1];
    }

    if (status) {
      find["status"] = status;
    }

    if (from && to) {
      const oneDay = 1000 * 60 * 60 * 24;
      const start = new Date(
        new Date(new Date(from).setUTCHours(0)).getTime() + oneDay
      );
      const end = new Date(
        new Date(new Date(to).setUTCHours(0)).getTime() + oneDay * 2
      );

      find = {
        $and: [
          { ...find },
          { createdAt: { $gte: start } },
          { createdAt: { $lt: end } },
        ],
      };
    }

    const customers = await Customer.find({
      deleted: false,
      $or: [
        { firstName: { $regex: keyword, $options: "si" } },
        { lastName: { $regex: keyword, $options: "si" } },
      ],
    })
      .select("firstName lastName avatar")
      .lean();

    find["user_id"] = {
      $in: customers.map((it) => String(it._id)),
    };

    const totalRecord = await Order.countDocuments(find);

    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objPagination = Pagination(initPagination, req.query, totalRecord);

    const orders = await Order.find(find)
      .skip(objPagination.skip)
      .limit(objPagination.limitItems)
      .sort(sort)
      .lean();

    // const cusIds = orders.map((item) => item.user_id);

    for (const order of orders) {
      const customer = customers.find(
        (item) => String(item._id) === order.user_id
      );
      if (customer) {
        order["customer"] = customer;
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        orders,
        totalRecord,
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

// [PATCH] /orders/change-status/:id
export const changeStatus = async (req: MyRequest, res: Response) => {
  try {
    const order_id = req.params.id;

    const { status } = req.body;

    const order = await Order.findOne({ _id: order_id });

    const customer = await Customer.findOne({ _id: order.user_id });

    if (!order) {
      throw Error("Order not found!");
    }

    if (status === "confirmed" && order.status === "pending") {
      //update stock here;

      const skus = order.products.map((item) => item.SKU);

      const products = await Product.find({
        SKU: { $in: skus },
        deleted: false,
      });
      const subProducts = await SubProduct.find({
        SKU: { $in: skus },
        deleted: false,
      });

      if (
        products.some((item) => item.stock <= 0) ||
        subProducts.some((item) => item.stock <= 0)
      ) {
        throw Error("Some products are outting of stock!");
      }

      await updateStockWhenOrder(order, "minus");
    }

    if (status === "canceled") {
      if (order.status !== "pending") {
        //update stock here;
        console.log("need update stock because this order status is canceled");
      }
      order.cancel = {
        reasonCancel: req.body.reasonCancel,
        canceledBy: req.body.canceledBy,
        canceledAt: new Date(),
      };
    }

    //mail

    if (status === "delivered") {
      order.deliveredAt = new Date();
    }

    order.status = status;

    await order.save();

    //notify -> customer
    const notify1 = new Notification({
      user_id: order.user_id,
      type: "order",
      title: statusOrder(order.status).title,
      body: statusOrder(order.status).body,
      ref_id: order.orderNo,
      ref_link: "/profile/orders",
      image: statusOrder(order.status).image,
      receiver: "customer",
    });

    await notify1.save();

    if (customer.setting.notification || !customer.setting) {
      const io = getIo();
      io.emit("SERVER_RETURN_CHANGE_STATUS_ORDER", {
        user_id: order.user_id,
        title: statusOrder(order.status).title,
        body: statusOrder(order.status).body,
        ref_id: order.orderNo,
        ref_link: "/profile/orders",
        image: statusOrder(order.status).image,
        message: `Your order with orderNo: ${order.orderNo} has been placed successfully!`,
      });
    }

    res.json({
      code: 200,
      message: "Status Updated!",
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

// [GET] /order/detail/:id
export const detail = async (req: MyRequest, res: Response) => {
  try {
    const order_id = req.params.id;

    if (!order_id) {
      throw Error("Missing order_id!");
    }

    const order = await Order.findOne({ _id: order_id, deleted: false }).lean();

    const customer = await Customer.findOne({ _id: order.user_id })
      .select("firstName lastName avatar email")
      .lean();

    order["customer"] = customer;

    res.json({
      code: 200,
      message: "OK",
      data: order,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [GET] /orders/statistic
export const statistic = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ deleted: false });
    const delivereds = orders.filter(
      (item) => item.status === "delivered"
    ).length;
    let revenue = 0,
      cost = 0;

    for (const item of orders) {
      if (item.status !== "canceled") {
        const products = item.products;
        for (const pro of products) {
          revenue += pro.price;
          cost += pro.cost;
        }
      }
    }

    const carts = await Cart.find({ deleted: false });
    const cartIds = carts.map((item) => item.id);

    const cartItems = await CartDetail.find({
      cart_id: { $in: cartIds },
      deleted: false,
    });

    const quantityInCart = cartItems.reduce((val, item) => {
      return val + item.quantity;
    }, 0);

    res.json({
      code: 200,
      message: "OK",
      data: {
        revenue,
        cost,
        sales: orders.length,
        delivereds,
        quantityInCart,
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

// [GET] /orders/chart
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
      let dayOfTheWeek = new Date().getDay();

      if (dayOfTheWeek === 0) {
        dayOfTheWeek = 7;
      }

      const response = await getDataChartHelper(
        type,
        dayOfTheWeek,
        7,
        "orders",
        Order,
        "price"
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
        "orders",
        Order,
        "price"
      );

      data = [...response];
    } else {
      const response = await getDataChartHelper(
        "year",
        1,
        12,
        "orders",
        Order,
        "price"
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

// [GET] /orders/chart-2
export const getDataChart2 = async (req: Request, res: Response) => {
  try {
    const oneDay = 1000 * 60 * 60 * 24;
    const thisYear = new Date().getFullYear();
    const response = [];
    for (let i = 1; i <= 12; i++) {
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
      const orders = await Order.find({
        $and: [
          { deleted: false },
          { createdAt: { $gte: newStart } },
          { createdAt: { $lt: newEnd } },
        ],
      });

      const label = dateHelper.monthOfTheYear(i - 1, "short");

      response.push({
        name: "orders",
        label: label,
        value: orders.length,
      });
      response.push({
        name: "delivered",
        label: label,
        value: orders.filter((item) => item.status === "delivered").length,
      });
    }
    res.json({
      code: 200,
      message: "OK!",
      data: response,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
