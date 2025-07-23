import { Request, Response } from "express";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Address from "../../models/address.model";
import Payment from "../../models/paymentMethod.model";

// [GET] /payments
export const index = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;
    const method = req.query.method;

    const payments = await Payment.find({
      user_id: user_id,
      deleted: false,
      method: method,
    }).sort({ isDefault: -1 });

    res.json({
      code: 200,
      message: "OK",
      data: payments,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /payments/create
export const create = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const payment = new Payment({
      ...body,
      user_id: user_id,
    });

    await payment.save();

    res.json({
      code: 200,
      message: "Created!",
      data: payment,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
