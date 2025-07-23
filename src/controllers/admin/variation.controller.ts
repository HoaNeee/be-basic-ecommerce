import { Request, Response } from "express";
import Pagination from "../../../helpers/pagination";
import Variation from "../../models/variation.model";
import VariationOption from "../../models/variationOption.model";
import SubProductOption from "../../models/subProductOption.model";

// [GET] /variations
export const index = async (req: Request, res: Response) => {
  try {
    const find = {
      deleted: false,
    };

    const records = await Variation.find(find);

    res.json({
      code: 200,
      message: "OK",
      data: records,
      totalRecord: 0,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /variations/create
export const create = async (req: Request, res: Response) => {
  try {
    const exist = await Variation.findOne({
      key: req.body.key,
      deleted: false,
    });
    if (exist) {
      throw Error("Variation already existing!");
    }

    const variation = new Variation(req.body);
    await variation.save();
    res.json({
      code: 200,
      message: "Successfully!!",
      data: variation,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /variations/edit/:id
export const edit = async (req: Request, res: Response) => {
  try {
    const variation_id = req.params.id;
    if (!variation_id) {
      throw Error("Missing variation_id!");
    }
    await Variation.updateOne({ _id: variation_id }, req.body);
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

// [DELETE] /variations/delete/:id
export const remove = async (req: Request, res: Response) => {
  try {
    const variation_id = req.params.id;

    if (!variation_id) {
      throw Error("Missing variation_id!");
    }

    const variation = await Variation.findOne({
      _id: variation_id,
      deleted: false,
    });

    if (variation) {
      const variationOptions = await VariationOption.find({
        variation_id: variation.id,
        deleted: false,
      });

      const ids = variationOptions.map((item) => item.id);

      await SubProductOption.updateMany(
        {
          variation_option_id: { $in: ids },
        },
        { deleted: true, deletedAt: new Date() }
      );

      await VariationOption.updateMany(
        { variation_id: { $in: [variation.id] } },
        { deleted: true, deletedAt: new Date() }
      );
    }

    variation.deleted = true;
    variation.deletedAt = new Date();
    await variation.save();

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
