import { Request, Response } from "express";
import Category from "../../models/category.model";
import Pagination from "../../../helpers/pagination";
import Product from "../../models/product.model";

// [GET] /categories
export const index = async (req: Request, res: Response) => {
  try {
    const find = {
      deleted: false,
    };
    const totalRecord = await Category.countDocuments(find);

    const initObjPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initObjPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(initObjPagination, req.query, 0);
    const records = await Category.find(find)
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

// [POST] /categories/create
export const create = async (req: Request, res: Response) => {
  try {
    const slug = req.body.slug;
    const parent_id = req.body.parent_id;
    const exist = await Category.findOne({
      $and: [{ slug: slug }, { parent_id: parent_id }, { deleted: false }],
    });
    if (exist) {
      throw new Error("Category is existing!");
    }

    const record = new Category(req.body);
    await record.save();
    res.json({
      code: 200,
      message: "Create new successfully!",
      data: record,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /categories/eidt/:id
export const edit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const slug = req.body.slug;
    const parent_id = req.body.parent_id;
    const exist = await Category.findOne({
      $and: [
        { slug: slug },
        { parent_id: parent_id },
        { deleted: false },
        { _id: { $ne: id } },
      ],
    });
    if (exist) {
      throw new Error("Category is existing!");
    }

    //LOOP with child of child of parent! -> FIX THEN

    await Category.updateOne({ _id: id }, req.body);
    res.json({
      code: 200,
      message: "Successfully!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const category_id = req.params.id;

    const findProductAndPulll = async (category_id: string) => {
      const product = await Product.find({ categories: category_id });
      const ids = product.map((item) => item.id);
      await Product.updateMany(
        { _id: { $in: ids } },
        {
          $pull: { categories: { $in: [category_id] } },
        }
      );
    };

    //can optimize
    const findAllChildrenAndDel = async (id: string) => {
      const records = await Category.find({ parent_id: id, deleted: false });

      if (records.length > 0) {
        for (const item of records) {
          item.deleted = true;
          item.deletedAt = new Date().toISOString();
          await item.save();
          findProductAndPulll(item.id);
          await findAllChildrenAndDel(item.id);
        }
      }
    };

    await findAllChildrenAndDel(category_id);

    findProductAndPulll(category_id);

    await Category.updateOne(
      { _id: category_id },
      { deleted: true, deletedAt: new Date().toISOString() }
    );

    res.json({
      code: 200,
      message: "Successfully!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
