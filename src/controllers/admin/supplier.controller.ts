import { Request, Response } from "express";
import { MyRequest } from "../../middlewares/admin/auth.middleware";
import Supplier from "../../models/supplier.model";
import Pagination from "../../../helpers/pagination";
import Category from "../../models/category.model";

// [GET] /suppliers
export const suppliers = async (req: Request, res: Response) => {
  try {
    const find = {
      deleted: false,
    };

    const isTakingReturn = req.query.isTakingReturn;
    const keyword = req.query.keyword;
    const categories = req.query.categories as string;

    if (categories && categories !== "") {
      const array = categories.split(",");
      find["categories"] = { $in: array };
    }

    if (
      isTakingReturn !== undefined &&
      isTakingReturn !== null &&
      isTakingReturn !== ""
    ) {
      find["isTaking"] = Number(isTakingReturn);
    }

    if (keyword) {
      find["name"] = { $regex: keyword, $options: "si" };
    }

    const initObjectPagination = {
      page: 1,
      limitItems: 10,
    };

    const totalRecord = await Supplier.countDocuments(find);

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
      data: records,
      totalRecord: totalRecord,
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [POST] /suppliers/create
export const create = async (req: MyRequest, res: Response) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.json({
      code: 200,
      message: "Create new successfully!",
      data: supplier,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 500,
      message: error.message || error,
    });
  }
};

// [PATCH] /suppliers/edit/:id
export const update = async (req: MyRequest, res: Response) => {
  try {
    const recordId = req.params.id;
    await Supplier.updateOne({ _id: recordId }, req.body);
    res.json({
      code: 200,
      message: "Update successfully!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 500,
      message: error.message || error,
    });
  }
};

// [DELETE] /suppliers/remove/:id
export const remove = async (req: MyRequest, res: Response) => {
  try {
    const recordId = req.params.id;
    await Supplier.updateOne(
      { _id: recordId },
      { deleted: true, deletedAt: new Date().toISOString() }
    );
    res.json({
      code: 200,
      message: "successfully!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 500,
      message: error.message || error,
    });
  }
};

// [GET] /suppliers/get-form
export const form = async (req: Request, res: Response) => {
  try {
    const rule = (name: string) => {
      return {
        required: true,
        message: "Please enter " + name,
      };
    };

    const categories = await Category.find({ deleted: false }).select(
      "title _id"
    );

    const formData = {
      nameForm: "supplier",
      size: "large",
      labelCol: 8,
      layout: "horizontal",
      title: "Supplier",
      formItems: [
        {
          key: "name",
          value: "name",
          label: "Supplier Name",
          rule: rule("Supplier Name"),
          placeholder: "Entersupplier name",
          type: "default",
        },
        {
          key: "email",
          value: "email",
          label: "Supplier Email",
          rule: rule("Supplier email"),
          placeholder: "Enter Supplier email",
          type: "default",
          typeInput: "email",
        },
        {
          key: "categories",
          value: "categories",
          label: "Category",
          rule: rule("Categories"),
          placeholder: "Select product category",
          type: "select",
          look_items: categories.map((item) => ({
            label: item.title,
            value: item._id,
          })),
        },
        {
          key: "contact",
          value: "contact",
          label: "Contact Number",
          placeholder: "Enter supplier contact number",
          type: "default",
        },
        {
          key: "type",
          value: "isTaking",
          label: "Taking",
          type: "checkbox",
          typeInput: "checkbox",
        },
      ],
    };

    res.json({
      code: 200,
      message: "OK",
      data: formData,
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [POST] /suppliers/export-excel
export const exportExcel = async (req: MyRequest, res: Response) => {
  try {
    const { start, end } = req.query;

    let find: any = {};

    if (start && end) {
      find = {
        $and: [
          {
            createdAt: { $gte: start },
          },
          { createdAt: { $lte: end } },
          { deleted: false },
        ],
      };
    }

    const { select, value, page } = req.body.options;

    let skip = (page - 1) * value;

    const totalRecord = await Supplier.countDocuments(find);

    if (value === totalRecord) {
      skip = 0;
    }

    const records = await Supplier.find(find)
      .select((select || []).join(" "))
      .skip(skip)
      .limit(value);

    res.json({
      code: 200,
      message: "successfully!",
      data: records,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 500,
      message: error.message || error,
    });
  }
};

// [GET] /suppliers/data-export
export const dataExport = async (req: MyRequest, res: Response) => {
  try {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const start = req.query.start;
    const end = req.query.end;

    const find: any = {
      $and: [
        {
          createdAt: { $gte: start },
        },
        { createdAt: { $lte: end } },
        { deleted: false },
      ],
    };

    let skip = (page - 1) * limit;

    const totalRecord = await Supplier.countDocuments(find);

    if (limit === totalRecord) {
      skip = 0;
    }

    const records = await Supplier.countDocuments({
      $and: [
        {
          createdAt: { $gte: start },
        },
        { createdAt: { $lte: end } },
        { deleted: false },
      ],
    })
      .skip(skip)
      .limit(limit);

    res.json({
      code: 200,
      message: "successfully!",
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
