import { Request, Response } from "express";
import Subscriber from "../../models/subscriber.model";

export const createSubscriber = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ code: 400, error: "Email is required" });
      return;
    }

    const exist = await Subscriber.findOne({ email });
    if (exist) {
      res.status(200).json({ code: 200, message: "Subscriber successfully!" });
      return;
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();
    res.status(200).json({
      code: 200,
      message: "Subscriber successfully!",
    });
  } catch (error) {
    res.status(500).json({ code: 500, error: "Failed to subscribe" });
  }
};
