import { Request, Response } from "express";
import Customer from "../../models/customer.model";
import Pagination from "../../../helpers/pagination";

// [GET] /customers
export const index = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: false,
    };

    const status = req.query.status || "";
    const keyword = req.query.keyword || "";

    if (keyword) {
      find = {
        ...find,
        $or: [
          { firstName: { $regex: keyword, $options: "si" } },
          { lastName: { $regex: keyword, $options: "si" } },
        ],
      };
    }

    if (status) {
      find["status"] = status;
    }

    const totalRecord = await Customer.countDocuments(find);

    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objPagination = Pagination(initPagination, req.query, totalRecord);

    const customers = await Customer.find(find)
      .skip(objPagination.skip)
      .limit(objPagination.limitItems)
      .select("-password");

    res.json({
      code: 200,
      message: "OK",
      data: {
        customers,
        totalRecord,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [PATCH] /customers/change-status/:id
export const changeStatus = async (req: Request, res: Response) => {
  try {
    const cus_id = req.params.id;

    if (!cus_id) {
      throw Error("Missing customer_id");
    }

    await Customer.updateOne(
      { _id: cus_id },
      {
        status: req.body.status,
      }
    );

    res.json({
      code: 200,
      message: "Update status success!",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
