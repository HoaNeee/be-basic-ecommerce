import { Response, Request } from "express";
import CustomerContact from "../../models/customerContact.model";
import Pagination from "../../../helpers/pagination";

//[GET] /customer-contacts
export const getCustomerContacts = async (req: Request, res: Response) => {
  try {
    const find = {};
    const keyword = req.query.keyword as string;
    const status = req.query.status as string;
    const subject = req.query.subject as string;

    if (keyword) {
      find["$or"] = [
        { email: { $regex: keyword, $options: "i" } },
        { name: { $regex: keyword, $options: "i" } },
        { subject: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      find["status"] = status;
    }

    if (subject && subject !== "all") {
      find["subject"] = subject;
    }

    const totalRecord = await CustomerContact.countDocuments(find);

    const initPagination = {
      page: 1,
      limitItems: 10,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const pagination = Pagination(initPagination, req.query, totalRecord);

    const contacts = await CustomerContact.find(find)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limitItems);
    res.status(200).json({
      code: 200,
      message: "Success",
      data: {
        contacts,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching customer contacts: " + error });
  }
};

//[GET] /customer-contacts/stats
export const getCustomerContactsStats = async (req: Request, res: Response) => {
  try {
    const [
      totalContacts,
      resolvedContacts,
      responsedContacts,
      pendingContacts,
    ] = await Promise.all([
      CustomerContact.countDocuments(),
      CustomerContact.countDocuments({ status: "resolved" }),
      CustomerContact.countDocuments({ status: "responded" }),
      CustomerContact.countDocuments({ status: "pending" }),
    ]);

    res.status(200).json({
      code: 200,
      message: "Success",
      data: {
        totalContacts,
        resolvedContacts,
        responsedContacts,
        pendingContacts,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching customer contacts stats: " + error });
  }
};

//[POST] /customer-contacts/reply/:id
export const replyCustomerContact = async (req: Request, res: Response) => {
  try {
    const contactId = req.params.id;
    const { replyMessage, status } = req.body;

    if (!contactId || !replyMessage || !status) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const updatedContact = await CustomerContact.findByIdAndUpdate(
      contactId,
      { replyMessage, status },
      { new: true }
    );

    if (!updatedContact) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    //sent mail here

    res.status(200).json({
      code: 200,
      message: "Success",
      data: {
        contact: updatedContact,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error replying to customer contact: " + error });
  }
};

//[PATCH] /customer-contacts/mark-resolved/:id
export const markContactResolved = async (req: Request, res: Response) => {
  try {
    const contactId = req.params.id;

    if (!contactId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const updatedContact = await CustomerContact.findByIdAndUpdate(
      contactId,
      { status: "resolved" },
      { new: true }
    );

    if (!updatedContact) {
      res.status(404).json({ message: "Contact not found" });
      return;
    }

    //sent mail here

    res.status(200).json({
      code: 200,
      message: "Success",
      data: {
        contact: updatedContact,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error replying to customer contact: " + error });
  }
};
