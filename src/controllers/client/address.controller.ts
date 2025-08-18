import { Request, Response } from "express";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Address from "../../models/address.model";

// [GET] /address
export const index = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const address = await Address.find({
      user_id: user_id,
      deleted: false,
    }).sort({ isDefault: -1 });

    res.json({
      code: 200,
      message: "OK",
      data: {
        address,
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

// [GET] /address/default
export const addressDefault = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const address = await Address.findOne({
      user_id: user_id,
      deleted: false,
      isDefault: true,
    });

    res.json({
      code: 200,
      message: "OK",
      data: address,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /address/create
export const create = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const isDefault = body.isDefault;

    const newAddress = new Address({
      ...body,
      user_id: user_id,
    });

    if (isDefault) {
      const records = await Address.find({
        deleted: false,
        user_id: user_id,
        isDefault: true,
      });
      const ids = records.map((item) => item.id);
      await Address.updateMany({ _id: { $in: ids } }, { isDefault: false });
    }

    await newAddress.save();

    res.json({
      code: 200,
      message: "Created!",
      data: newAddress,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /address/edit/:id
export const edit = async (req: MyRequest, res: Response) => {
  try {
    const address_id = req.params.id;
    const user_id = req.userId;

    if (!address_id) {
      throw Error("Missing address_id");
    }
    const body = req.body;
    const isDefault = body.isDefault;

    const address = await Address.findOne({
      _id: address_id,
      user_id,
      deleted: false,
    });

    if (!address) {
      res.status(404).json({
        code: 404,
        message: "Address not found!",
      });
      return;
    }

    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { user_id: address.user_id, deleted: false },
        { isDefault: false }
      );
    }

    await Address.updateOne({ _id: address_id }, body);

    res.json({
      code: 200,
      message: "Updated!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [DELETE] /address/delete/:id
export const remove = async (req: MyRequest, res: Response) => {
  try {
    const address_id = req.params.id;
    const user_id = req.userId;

    if (!address_id) {
      throw Error("Missing address_id");
    }

    const address = await Address.findOne({
      _id: address_id,
      deleted: false,
    });

    if (!address) {
      res.status(404).json({
        code: 404,
        message: "Address not found!",
      });
      return;
    }

    if (address.user_id !== user_id) {
      res.status(403).json({
        code: 403,
        message: "Forbidden",
      });
      return;
    }

    if (address.isDefault) {
      await Address.deleteOne({ _id: address_id });
      //do then;
      const other = await Address.findOne({
        isDefault: false,
        _id: { $ne: address_id },
      });
      if (other) {
        other.isDefault = true;
        await other.save();
      }
      res.json({
        code: 200,
        message: "Deleted!",
        data: other,
      });
      return;
    }

    await Address.deleteOne({ _id: address_id });

    res.json({
      code: 200,
      message: "Updated!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};
