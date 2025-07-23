import { Response } from "express";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Order from "../../models/order.model";
import CartDetail from "../../models/cartDetail.model";
import { statusOrder, updateStockWhenOrder } from "../../../utils/order";
import Notification from "../../models/notification.model";
import { sendMail } from "../../../helpers/sendMail";
import Customer from "../../models/customer.model";
import Pagination from "../../../helpers/pagination";

interface TemplateHTMLOrder {
  cusName: string;
  orderNo: string;
  createdAt: string;
  status: string;
  total: string;
  link: string;
  products: any[];
  promotions?: {
    promotionType: string;
    value: string;
    code: string;
  };
}

const templateHtml = (order: TemplateHTMLOrder) => {
  const subTotal = order.products.reduce(
    (val, item) => val + item.quantity * item.price,
    0
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Xác nhận đơn hàng</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div>
          <h2>
              Cảm ơn bạn đã đặt hàng tại <strong>Kkrist</strong>!
          </h2>
          <p>
              Xin chào <strong>${order.cusName}</strong>,
          </p>
          <p>
              Đơn hàng <strong>#${
                order.orderNo
              }</strong> của bạn đã được đặt thành công.
          </p>

          <h3>Thông tin đơn hàng:</h3>
          <ul>
              <li>Ngày đặt: ${order.createdAt}</li>
              <li>Trạng thái: Chờ xác nhận</li>
          </ul>

          <h3>Danh sách sản phẩm:</h3>
          <table style="border: 1px solid #ddd;
          border-collapse: collapse;">
              <thead>
                  <tr>
                      <th style=" border: 1px solid #ddd;
          padding: 10px;">Sản phẩm</th>
                      <th style=" border: 1px solid #ddd;
          padding: 10px;">Số lượng</th>
                      <th style=" border: 1px solid #ddd;
          padding: 10px;">Giá</th>
                  </tr>
              </thead>
              <tbody>
                  ${order.products.map((item, index) => {
                    return `<tr key=${index}>
                      <td style=" border: 1px solid #ddd;
          padding: 10px;">${item.title}</td>
                      <td style=" border: 1px solid #ddd;
          padding: 10px;">${item.quantity}</td>
                      <td style=" border: 1px solid #ddd;
          padding: 10px;">${item.price}</td>
                  </tr>`;
                  })}

              </tbody>
          </table>

          <p>
              <span>Tổng giá:</span> ${Number(subTotal).toLocaleString()} VND
          </p>
          <p>
              <span>Chương trình khuyến mãi: </span> 
              ${
                order?.promotions
                  ? `Giảm: ${order.promotions.value}`
                  : `Không áp dụng`
              }
          </p>
          <p>
              <strong>Tổng cộng:</strong> ${order.total} VND
          </p>

          <p>
              Bạn có thể xem chi tiết đơn hàng tại:
              <a href="http://localhost:3000${order.link}">Xem đơn hàng</a>.
          </p>

          <p>Xin cảm ơn bạn đã mua sắm cùng <strong>Kkrist</strong>!</p>

          <div>
              <img src="https://res.cloudinary.com/dlogl1cn7/image/upload/v1752984530/logo_pztyyd.png"
                  style="height: 60px; width: 80px; object-fit: contain;" alt="">
          </div>

          <hr />
          <p style="font-size: 12px;">Đây là email tự động, vui lòng không trả lời email này.</p>
        </div>
      </body>
    </html>
  `;
};

// [GET] /order
export const index = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    let find = {
      user_id,
      deleted: false,
    };

    const keyword = req.query.keyword;
    const status = req.query.status;

    if (status) {
      find["status"] = status;
    }
    find["products.title"] = { $regex: keyword, $options: "si" };

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
      .sort({
        createdAt: "desc",
      })
      .skip(objPagination.skip)
      .limit(objPagination.limitItems);

    res.json({
      code: 200,
      message: "OK",
      data: {
        orders,
        totalRecord,
        totalPage: objPagination.totalPage,
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

// [GET] /order/detail/:order_no
export const detail = async (req: MyRequest, res: Response) => {
  try {
    const order_no = req.params.order_no;

    if (!order_no) {
      throw Error("Missing order_no!");
    }

    const order = await Order.findOne({ orderNo: order_no, deleted: false });

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

// [POST] /order/create
export const create = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const products = body.products;
    if (!products || products.some((item: any) => !item.SKU)) {
      throw Error("Missing products or SKU in products");
    }

    body.promotion = body.promotion || null;

    const promotion = body.promotion;

    let total = body.products.reduce((val: number, item: any) => {
      return val + item.price * item.quantity;
    }, 0);

    if (promotion) {
      const type = promotion.promotionType;
      const value = promotion.value;

      if (type === "percent") {
        total = total - total * (value / 100);
      } else {
        total = Math.max(0, total - value);
      }
    }

    body.totalPrice = Number(total).toFixed(0);

    const countDocument = await Order.countDocuments({ deleted: false });

    const orderNo = String(countDocument + 1).padStart(5, "0");

    const thisYear = new Date().getFullYear();

    body.orderNo = `WEB-${thisYear}-${orderNo}`;

    //update stock when confirm

    //update cart
    const cartItem_ids = body.cartItem_ids;

    await CartDetail.deleteMany({ _id: { $in: cartItem_ids } });

    const order = new Order({
      ...body,
      user_id: user_id,
    });

    await order.save();

    //send mail
    const customer = await Customer.findOne({ _id: user_id });

    const html = templateHtml({
      orderNo: order.orderNo,
      link: `/profile/orders?order_no=${order.orderNo}`,
      total: order.totalPrice.toLocaleString(),
      products: order.products,
      cusName: `${customer.firstName || "User"} ${customer.lastName || ""}`,
      createdAt: order.createdAt.toLocaleString(),
      status: order.status,
    });

    // check setting

    //notify -> custommer
    const notify1 = new Notification({
      user_id: order.user_id,
      type: "order",
      title: "Your ordered placed successfully",
      body: "You place a new order",
      ref_id: order.orderNo,
      ref_link: "/profile/orders",
      image: statusOrder(order.status).image,
      receiver: "customer",
    });

    if (customer) {
      if (customer.setting.emailNotification || !customer.setting) {
        sendMail(customer.email, "Đặt hàng thành công", html);
      }
      if (customer.setting.notification || !customer.setting) {
        await notify1.save();
      }
    }

    const notify2 = new Notification({
      // user_id: user_id, scale when many admin
      type: "order",
      title: "A order just placed",
      body: "Let check this order with orderNo: " + order.orderNo + " now",
      ref_id: order.id,
      ref_link: "/sale-orders/" + order.id,
      image: statusOrder(order.status).image,
      receiver: "admin",
    });
    await notify2.save();

    res.json({
      code: 200,
      message: "Ordered!",
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

// [PATCH] /order/edit/:id
export const editBill = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const order_id = req.params.id;

    console.log(user_id);
    console.log(order_id);

    res.json({
      code: 200,
      message: "Updated!",
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

// [PATCH] /order/change-status/:id
export const changeStatus = async (req: MyRequest, res: Response) => {
  try {
    // const user_id = req.userId;

    const order_id = req.params.id;

    const { status } = req.body;

    const order = await Order.findOne({ _id: order_id });

    if (status === "canceled") {
      if (order.status !== "pending") {
        //update stock here;
        // await updateStockWhenOrder(order, "plus");
      }
      order.cancel = {
        reasonCancel: req.body.reasonCancel,
        canceledBy: req.body.canceledBy,
        canceledAt: new Date(),
      };
      const notify = new Notification({
        type: "order",
        title: `A order has been canceled`,
        body: `Order ${order.orderNo}, Reason: ${
          req.body.reasonCancel || "no reason"
        }`,
        ref_id: String(order._id),
        ref_link: "/sale-orders/" + String(order._id),
        image: statusOrder(status).image,
        receiver: "admin",
      });
      await notify.save();
    }

    order.status = status;
    await order.save();

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
