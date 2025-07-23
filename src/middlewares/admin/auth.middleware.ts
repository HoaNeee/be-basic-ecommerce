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
    if (!req.headers.authorization) {
      res.json({
        code: 401,
        message: "Please sent request with token",
      });
      return;
    }
    const accessToken = req.headers.authorization.split(" ")[1];

    const decoded: any = jwt.verify(accessToken, process.env.SECRET_JWT_KEY);
    const userId = decoded.userId;

    // if (user.role !== "admin") {
    //   res.json({
    //     code: 402,
    //     message: "You don't have permission!",
    //   });
    //   return;
    // }
    req.userId = userId;
    next();
  } catch (error) {
    res.json({
      code: 402,
      message: error.message,
    });
  }
};
