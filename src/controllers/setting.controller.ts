import Setting from "../models/setting.model";
import { Request, Response } from "express";

//[PATCH] /setting
export const changeSetting = async (req: Request, res: Response) => {
  try {
    const settingData = req.body;

    const setting = await Setting.findOne({});

    const keywords = settingData.keywords || [];
    if (typeof keywords === "string") {
      settingData.keywords = keywords
        .replace(/<\/?[^>]+(>|$)/g, ",")
        .split(",")
        .map((keyword) => keyword.trim());
    }

    if (!setting) {
      const newSetting = new Setting(settingData);
      await newSetting.save();
      res.status(200).json({
        code: 200,
        message: "Settings created successfully",
        data: newSetting,
      });
      return;
    }

    const updatedSetting = await Setting.findOneAndUpdate({}, settingData, {
      new: true,
    });

    res.status(200).json({
      code: 200,
      message: "Settings updated successfully",
      data: updatedSetting,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      code: 500,
      message: "Internal server error",
    });
  }
};

//[GET] /admin/setting
export const getSetting = async (req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({});
    if (!setting) {
      res.status(404).json({
        code: 404,
        message: "Settings not found",
      });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error retrieving settings:", error);
    res.status(500).json({
      code: 500,
      message: "Internal server error",
    });
  }
};

//[POST] /admin/setting/create-subdomain
export const createSubdomain = async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.body;

    if (!subdomain) {
      res.status(400).json({
        code: 400,
        message: "Invalid subdomain data",
      });
      return;
    }

    const setting = await Setting.findOne({});
    if (!setting) {
      res.status(404).json({
        code: 404,
        message: "Settings not found",
      });
      return;
    }

    const existingSubdomains = setting.subdomain || [];

    const exists = existingSubdomains.some(
      (item) => item.toLowerCase() === subdomain.toLowerCase()
    );

    if (exists) {
      res.status(400).json({
        code: 400,
        message: "Subdomain already exists",
      });
      return;
    }

    existingSubdomains.push(subdomain);
    setting.subdomain = existingSubdomains;
    await setting.save();
    res.status(200).json({
      code: 200,
      message: "Subdomain created successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error retrieving settings:", error);
    res.status(500).json({
      code: 500,
      message: "Internal server error",
    });
  }
};

//[DELETE] /admin/setting/remove-subdomain
export const removeSubdomain = async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.body;

    if (!subdomain) {
      res.status(400).json({
        code: 400,
        message: "Invalid subdomain data",
      });
      return;
    }

    const setting = await Setting.findOne({});
    if (!setting) {
      res.status(404).json({
        code: 404,
        message: "Settings not found",
      });
      return;
    }

    const existingSubdomains = setting.subdomain || [];
    const index = existingSubdomains.findIndex(
      (item) => item.toLowerCase() === subdomain.toLowerCase()
    );

    if (index === -1) {
      res.status(400).json({
        code: 400,
        message: "Subdomain does not exist",
      });
      return;
    }

    existingSubdomains.splice(index, 1);
    setting.subdomain = existingSubdomains;
    await setting.save();

    res.status(200).json({
      code: 200,
      message: "Subdomain removed successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error retrieving settings:", error);
    res.status(500).json({
      code: 500,
      message: "Internal server error",
    });
  }
};

//[GET] /setting
export const getSettingClient = async (req: Request, res: Response) => {
  try {
    const setting = await Setting.findOne({}).select(
      "siteName companyName logoLight logoDark siteFavicon domain description keywords email phone address facebook instagram twitter youtube"
    );
    if (!setting) {
      res.status(404).json({
        code: 404,
        message: "Settings not found",
      });
      return;
    }

    res.status(200).json({
      code: 200,
      message: "successfully",
      data: setting,
    });
  } catch (error) {
    console.error("Error retrieving settings:", error);
    res.status(500).json({
      code: 500,
      message: "Internal server error",
    });
  }
};
