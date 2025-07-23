import { Request, Response } from "express";
import Pagination from "../../../helpers/pagination";
import VariationOption from "../../models/variationOption.model";
import Variation from "../../models/variation.model";
import SubProductOption from "../../models/subProductOption.model";

// [GET] /variation-options
export const index = async (req: Request, res: Response) => {
  try {
    const find: any = {
      deleted: false,
    };

    const { variation_id } = req.query;
    if (!variation_id) {
      throw Error("Missing variation_id!");
    }

    const variation = await Variation.findOne({ _id: variation_id });

    find.variation_id = variation.id;

    const records = await VariationOption.find(find);

    res.json({
      code: 200,
      message: "OK",
      data: records,
      variation: variation,
      totalRecord: 0,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /variation-options/create
export const create = async (req: Request, res: Response) => {
  try {
    const exist = await VariationOption.findOne({
      $and: [
        { key: req.body.key },
        { deleted: false },
        { variation_id: req.body.variation_id },
      ],
    });
    if (exist) {
      throw Error("Option already existing!");
    }

    const record = new VariationOption(req.body);
    await record.save();
    res.json({
      code: 200,
      message: "Successfully!!",
      data: record,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /variation-options/edit/:id
export const edit = async (req: Request, res: Response) => {
  try {
    const option_id = req.params.id;

    if (!option_id) {
      throw Error("Missing variation_option_id");
    }

    await VariationOption.updateOne({ _id: option_id }, req.body);
    res.json({
      code: 200,
      message: "Updated!!",
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [DELETE] /variation-options/delete/:id
export const remove = async (req: Request, res: Response) => {
  try {
    const option_id = req.params.id;

    if (!option_id) {
      throw Error("Missing variation_option_id!!");
    }

    await SubProductOption.updateMany(
      { variation_option_id: { $in: [option_id] } },
      { deleted: true, deletedAt: new Date() }
    );

    await VariationOption.updateOne(
      { _id: option_id },
      { deleted: true, deletedAt: new Date() }
    );

    res.json({
      code: 200,
      message: "Deleted",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
