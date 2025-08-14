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
export const customerRead = async (req: MyRequest, res: Response) => {
  try {
    const notify_id = req.params.id;
    const user_id = req.userId;

    await Notification.updateOne(
      { _id: notify_id, user_id: user_id },
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
