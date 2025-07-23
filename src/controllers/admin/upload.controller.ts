import { Request, Response } from "express";
import { uploadCloud } from "../../../helpers/uploadCloud";

// [POST] /upload
export const upload = async (req: any, res: Response) => {
  try {
    const { buffer } = req.file;
    const result: any = await uploadCloud(buffer);
    res.json({
      code: 200,
      message: "OK",
      data: result.url,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [POST] /upload/multi
export const uploads = async (req: Request, res: Response) => {
  try {
    const files = req.files;

    const length = files.length;
    const arr = [];
    for (let i = 0; i < Number(length); i++) {
      arr.push(files[i]);
    }

    const response = await Promise.all(
      arr.map(async (file) => {
        return await uploadCloud(file.buffer);
      })
    );

    const data = response.map((file: any) => file.url);

    res.json({
      code: 200,
      message: "OK",
      data: data,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 500,
      message: error.message,
    });
  }
};
