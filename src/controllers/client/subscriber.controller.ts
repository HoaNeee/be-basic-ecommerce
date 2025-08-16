import { Request, Response } from "express";
import Subscriber from "../../models/subscriber.model";
import CustomerContact from "../../models/customerContact.model";

//[POST] /subscribers
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

//[POST] /subscribers/create-contact
export const createContact = async (req: Request, res: Response) => {
  try {
    const { email, name, message, phone, subject } = req.body;

    if (!email || !name || !message || !phone || !subject) {
      res.status(400).json({ code: 400, error: "All fields are required" });
      return;
    }

    const newContact = new CustomerContact({
      email,
      name,
      message,
      phone,
      subject,
    });
    await newContact.save();
    res.status(200).json({
      code: 200,
      message: "Contact created successfully!",
    });
  } catch (error) {
    res.status(500).json({ code: 500, error: "Failed to create contact" });
  }
};
