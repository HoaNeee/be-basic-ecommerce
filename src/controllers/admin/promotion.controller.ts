import { Request, Response } from "express";
import Promotion from "../../models/promotion.model";
import Pagination from "../../../helpers/pagination";

// [GET] /promotions
export const promotions = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: false,
    };

    const status = req.query.status;
    const promotionType = req.query.promotionType;
    const keyword = req.query.keyword;

    if (status) {
      const now = new Date();
      if (status === "intime") {
        find["$or"] = [
          { startAt: { $lte: now }, endAt: { $gte: now } },
          { startAt: { $lte: now }, endAt: { $eq: null } },
        ];
      } else if (status === "expired") {
        find["$or"] = [{ startAt: { $lte: now }, endAt: { $lt: now } }];
      } else if (status === "upcoming") {
        find["startAt"] = { $gt: now };
      }
    }

    if (promotionType) {
      find["promotionType"] = promotionType;
    }

    if (keyword) {
      find = {
        ...find,
        $and: [
          {
            $or: [
              { title: { $regex: keyword, $options: "i" } },
              { description: { $regex: keyword, $options: "i" } },
            ],
          },
        ],
      };
    }

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
      data: {
        promotions: records,
        totalRecord,
      },
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
    promotion.colorBackground = req.body.colorBackground || "black";
    promotion.colorText = req.body.colorText || "black";
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
