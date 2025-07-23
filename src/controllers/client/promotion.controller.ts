import { Request, Response } from "express";
import Promotion from "../../models/promotion.model";
import Pagination from "../../../helpers/pagination";

// [GET] /promotions
export const promotions = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: false,
    };

    const now = new Date();
    find = {
      ...find,
      $or: [
        {
          $and: [
            { startAt: { $lte: now } },
            { endAt: { $gte: now } },
            { maxUse: { $gt: 0 } },
          ],
        },
        {
          endAt: null,
          maxUse: { $gt: 0 },
        },
      ],
    };

    const totalRecord = await Promotion.countDocuments(find);

    const initObjPagination = {
      page: 1,
      limitItems: 5,
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

// [GET] /promotions/check-code
export const checkCode = async (req: Request, res: Response) => {
  try {
    const code = req.query.code;

    const promotion = await Promotion.findOne({
      code: code,
      deleted: false,
    });

    if (!promotion) {
      throw Error("Code Invalid!");
    }

    const now = Date.now();
    const start = new Date(promotion.startAt).getTime();
    const end = promotion.endAt;

    if (start > now) {
      throw Error("Code not applied!");
    }

    if (end) {
      if (new Date(end).getTime() < now) {
        throw Error("Code has expired!");
      }
    }

    if (promotion.maxUse <= 0) {
      throw Error("Code has out of uses!");
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        promotionType: promotion.promotionType,
        value: promotion.value,
        title: promotion.title,
      },
      // totalRecord: totalRecord,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [GET] /promotions/deal-of-month
export const dealOfMonth = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const find = {
      deleted: false,
      startAt: { $lt: now },
      $or: [
        {
          endAt: { $gte: now },
        },
        {
          endAt: null,
        },
      ],
    };

    const deals = await Promotion.find(find).sort({ value: "desc" }).lean();

    res.json({
      code: 200,
      message: "OK",
      data: deals[0],
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
