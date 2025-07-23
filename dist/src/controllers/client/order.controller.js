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
exports.changeStatus = exports.editBill = exports.create = exports.detail = exports.index = void 0;
const order_model_1 = __importDefault(require("../../models/order.model"));
const cartDetail_model_1 = __importDefault(require("../../models/cartDetail.model"));
const order_1 = require("../../../utils/order");
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const sendMail_1 = require("../../../helpers/sendMail");
const customer_model_1 = __importDefault(require("../../models/customer.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const socket_1 = require("../../../socket");
const templateHtml = (order) => {
    const subTotal = order.products.reduce((val, item) => val + item.quantity * item.price, 0);
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
              Đơn hàng <strong>#${order.orderNo}</strong> của bạn đã được đặt thành công.
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
              ${(order === null || order === void 0 ? void 0 : order.promotions)
        ? `Giảm: ${order.promotions.value}`
        : `Không áp dụng`}
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
const index = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const totalRecord = yield order_model_1.default.countDocuments(find);
        const initPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const objPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const orders = yield order_model_1.default.find(find)
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
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.index = index;
const detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order_no = req.params.order_no;
        if (!order_no) {
            throw Error("Missing order_no!");
        }
        const order = yield order_model_1.default.findOne({ orderNo: order_no, deleted: false });
        res.json({
            code: 200,
            message: "OK",
            data: order,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.detail = detail;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_id = req.userId;
        const body = req.body;
        const products = body.products;
        if (!products || products.some((item) => !item.SKU)) {
            throw Error("Missing products or SKU in products");
        }
        body.promotion = body.promotion || null;
        const promotion = body.promotion;
        let total = body.products.reduce((val, item) => {
            return val + item.price * item.quantity;
        }, 0);
        if (promotion) {
            const type = promotion.promotionType;
            const value = promotion.value;
            if (type === "percent") {
                total = total - total * (value / 100);
            }
            else {
                total = Math.max(0, total - value);
            }
        }
        body.totalPrice = Number(total).toFixed(0);
        const countDocument = yield order_model_1.default.countDocuments({ deleted: false });
        const orderNo = String(countDocument + 1).padStart(5, "0");
        const thisYear = new Date().getFullYear();
        body.orderNo = `WEB-${thisYear}-${orderNo}`;
        const cartItem_ids = body.cartItem_ids;
        yield cartDetail_model_1.default.deleteMany({ _id: { $in: cartItem_ids } });
        const order = new order_model_1.default(Object.assign(Object.assign({}, body), { user_id: user_id }));
        yield order.save();
        const customer = yield customer_model_1.default.findOne({ _id: user_id });
        const html = templateHtml({
            orderNo: order.orderNo,
            link: `/profile/orders?order_no=${order.orderNo}`,
            total: order.totalPrice.toLocaleString(),
            products: order.products,
            cusName: `${customer.firstName || "User"} ${customer.lastName || ""}`,
            createdAt: order.createdAt.toLocaleString(),
            status: order.status,
        });
        const io = (0, socket_1.getIo)();
        const notify1 = new notification_model_1.default({
            user_id: order.user_id,
            type: "order",
            title: "Your ordered placed successfully",
            body: "You place a new order",
            ref_id: order.orderNo,
            ref_link: "/profile/orders",
            image: (0, order_1.statusOrder)(order.status).image,
            receiver: "customer",
        });
        if (customer) {
            if (customer.setting.emailNotification || !customer.setting) {
                (0, sendMail_1.sendMail)(customer.email, "Đặt hàng thành công", html);
            }
            if (customer.setting.notification || !customer.setting) {
                io.emit("SERVER_RETURN_USER_PLACED_ORDER", {
                    user_id: order.user_id,
                    title: "Your ordered placed successfully",
                    body: "You place a new order",
                    ref_id: order.orderNo,
                    ref_link: "/profile/orders",
                    image: (0, order_1.statusOrder)(order.status).image,
                    message: `Your order with orderNo: ${order.orderNo} has been placed successfully!`,
                });
                yield notify1.save();
            }
        }
        const notify2 = new notification_model_1.default({
            type: "order",
            title: "A order just placed",
            body: "Let check this order with orderNo: " + order.orderNo + " now",
            ref_id: order.id,
            ref_link: "/sale-orders/" + order.id,
            image: (0, order_1.statusOrder)(order.status).image,
            receiver: "admin",
        });
        io.emit("SERVER_RETURN_NEW_ORDER", Object.assign(Object.assign({}, notify2.toObject()), { message: `A order just placed with orderNo: ${order.orderNo}, please check it now!` }));
        yield notify2.save();
        res.json({
            code: 200,
            message: "Ordered!",
            data: order,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.create = create;
const editBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.editBill = editBill;
const changeStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order_id = req.params.id;
        const { status } = req.body;
        const order = yield order_model_1.default.findOne({ _id: order_id });
        if (status === "canceled") {
            if (order.status !== "pending") {
            }
            order.cancel = {
                reasonCancel: req.body.reasonCancel,
                canceledBy: req.body.canceledBy,
                canceledAt: new Date(),
            };
            const notify = new notification_model_1.default({
                type: "order",
                title: `A order has been canceled`,
                body: `Order ${order.orderNo}, Reason: ${req.body.reasonCancel || "no reason"}`,
                ref_id: String(order._id),
                ref_link: "/sale-orders/" + String(order._id),
                image: (0, order_1.statusOrder)(status).image,
                receiver: "admin",
            });
            yield notify.save();
        }
        order.status = status;
        yield order.save();
        res.json({
            code: 200,
            message: "Status Updated!",
            data: {},
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            code: 400,
            message: error.message || error,
        });
    }
});
exports.changeStatus = changeStatus;
