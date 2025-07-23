import { Request, Response } from "express";
import { MyRequest } from "../middlewares/admin/auth.middleware";
import { sendMail } from "../../helpers/sendMail";
import Notification from "../models/notification.model";

//[GET] /notifications
export const customers = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    let find = {
      deleted: false,
      user_id: user_id,
      receiver: "customer",
    };

    const notifications = await Notification.find(find).sort({
      createdAt: "desc",
    });

    res.json({
      code: 200,
      message: "Notification OK!",
      data: {
        notifications,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

//[GET] /notifications/check-read
export const checkRead = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    let find = {
      deleted: false,
      user_id: user_id,
      receiver: "customer",
      isRead: false,
    };

    const len = await Notification.countDocuments(find).limit(1);

    res.json({
      code: 200,
      message: "Notification OK!",
      data: !!len,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

//[GET] /notifications/admin
export const admin = async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find({
      deleted: false,
      receiver: "admin",
    }).sort({ createdAt: "desc" });

    res.json({
      code: 200,
      message: "Notification OK!",
      data: {
        notifications,
      },
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

//[PATCH] /notifications/read/:id
export const customerRead = async (req: Request, res: Response) => {
  try {
    const notify_id = req.params.id;

    await Notification.updateOne(
      { _id: notify_id },
      {
        isRead: true,
      }
    );

    res.json({
      code: 200,
      message: "OK!",
      data: [],
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
//[PATCH] /admin/notifications/read/:id
export const adminRead = async (req: Request, res: Response) => {
  try {
    const notify_id = req.params.id;

    await Notification.updateOne(
      { _id: notify_id },
      {
        isRead: true,
      }
    );

    res.json({
      code: 200,
      message: "OK!",
      data: [],
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

const templateHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Xác nhận đơn hàng</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Cảm ơn bạn đã đặt hàng tại ShopName!</h2>
      <p>Xin chào <strong>{{customerName}}</strong>,</p>
      <p>Đơn hàng <strong>#{{orderNumber}}</strong> của bạn đã được đặt thành công.</p>

      <h3>Thông tin đơn hàng:</h3>
      <ul>
        <li>Ngày đặt: {{orderDate}}</li>
        <li>Trạng thái: {{orderStatus}}</li>
      </ul>

      <h3>Danh sách sản phẩm:</h3>
      <table border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Giá</th>
          </tr>
        </thead>
        <tbody>
          {{orderItems}}
        </tbody>
      </table>

      <p><strong>Tổng cộng:</strong> {{totalAmount}} VND</p>

      <p>Bạn có thể xem chi tiết đơn hàng tại: 
        <a href="{{orderLink}}">Xem đơn hàng</a>.
      </p>

      <p>Xin cảm ơn bạn đã mua sắm cùng ShopName!</p>

      <hr />
      <p style="font-size: 12px; color: #777;">
        Đây là email tự động, vui lòng không trả lời email này.
      </p>
    </body>
  </html>`;
