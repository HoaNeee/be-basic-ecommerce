import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface MyRequest extends Request {
  userId: string;
}

export const isAccess = async (
  req: MyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.jwt_token;

    if (!token) {
      throw Error("Missing token!!");
    }

    const decoded: any = jwt.verify(token, process.env.SECRET_JWT_KEY);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.clearCookie("jwt_token");
    res.json({
      code: 402,
      message: error.message,
    });
  }
};
