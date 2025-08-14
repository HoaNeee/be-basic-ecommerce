import { Request, Response, NextFunction } from "express";
import { MyRequest } from "./auth.middleware";
import Cart from "../../models/cart.model";

export const isExist = async (
  req: MyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.userId;
    const cart = await Cart.findOne({ user_id: user_id }).select(
      "-deleted -deletedAt"
    );

    if (!cart) {
      throw new Error("Cart not found");
    }

    req.cartId = cart.id;

    next();
  } catch (error) {
    res.json({
      code: 404,
      message: error.message,
    });
  }
};
