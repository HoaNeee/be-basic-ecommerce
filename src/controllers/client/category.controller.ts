import { Request, Response } from "express";
import Category from "../../models/category.model";

// [GET] /categories
export const index = async (req: Request, res: Response) => {
  try {
    // console.log(req.cookies);
    // // console.log(req.signedCookies);
    // console.log(req.headers);

    const find = {
      deleted: false,
    };

    const records = await Category.find(find);

    res.json({
      code: 200,
      message: "OK",
      data: records,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
