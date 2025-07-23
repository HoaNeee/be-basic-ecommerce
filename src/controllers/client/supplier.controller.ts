import { Request, Response } from "express";
import Supplier from "../../models/supplier.model";
import Pagination from "../../../helpers/pagination";

// [GET] /suppliers
export const index = async (req: Request, res: Response) => {
  try {
    const find = {
      deleted: false,
    };

    const totalRecord = await Supplier.countDocuments(find);
    const initObjectPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initObjectPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(
      initObjectPagination,
      req.query,
      totalRecord
    );

    const records = await Supplier.find(find)
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems);
    res.json({
      code: 200,
      data: {
        suppliers: records,
        totalRecord: totalRecord,
      },
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};
