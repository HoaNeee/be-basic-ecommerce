import { Request, Response } from "express";
import Promotion from "../../models/promotion.model";
import Pagination from "../../../helpers/pagination";
import Product from "../../models/product.model";

// [GET] /promotions
export const index = async (req: Request, res: Response) => {
  try {
    const find = {
      deleted: false,
    };
    const totalRecord = await Promotion.countDocuments(find);

    const initObjPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initObjPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(initObjPagination, req.query, 0);
    const records = await Promotion.find(find)
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems);

    res.json({
      code: 200,
      message: "OK",
      data: records,
      totalRecord: totalRecord,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /promotions/create
export const create = async (req: Request, res: Response) => {
  try {
    const promotion = new Promotion(req.body);
    await promotion.save();

    res.json({
      code: 201,
      data: promotion,
      message: "Successfully!!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /promotions/edit/:id
export const edit = async (req: Request, res: Response) => {
  try {
    const promotion_id = req.params.id;

    if (!promotion_id) {
      throw Error("Missing _id!!");
    }

    await Promotion.updateOne({ _id: promotion_id }, req.body);

    res.json({
      code: 202,
      message: "Successfully!!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [DELETE] /promotions/delete/:id
export const remove = async (req: Request, res: Response) => {
  try {
    const promotion_id = req.params.id;

    if (!promotion_id) {
      throw Error("Missing _id!!");
    }

    await Promotion.deleteOne({ _id: promotion_id });

    res.json({
      code: 203,
      message: "Successfully!!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
