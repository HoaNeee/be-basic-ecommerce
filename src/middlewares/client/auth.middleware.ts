import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { clearCookie } from "../../controllers/client/auth.controller";
import { Setting } from "../../types/setting.types";

export interface MyRequest extends Request {
  userId: string;
  setting?: Setting;
}

export const isAccess = async (
  req: MyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.jwt_token;

    if (!token) {
      res.json({
        code: 401,
        message: "You are not logged in!",
      });
      return;
    }

    const decoded: any = jwt.verify(token, process.env.SECRET_JWT_KEY);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    clearCookie(res);

    res.json({
      code: 402,
      message: error.message,
    });
  }
};
