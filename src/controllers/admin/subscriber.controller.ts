import { Request, Response } from "express";
import Subscriber from "../../models/subscriber.model";
import Pagination from "../../../helpers/pagination";

//[GET] /admin/subscribers
export const getSubscribers = async (req: Request, res: Response) => {
  try {
    const find = {};

    const keyword = req.query.keyword as string;
    const isSent = req.query.isSent;

    if (isSent && isSent !== "all") {
      const isSentBoolean = isSent === "sent";
      find["isSent"] = isSentBoolean;
    }

    if (keyword) {
      find["email"] = { $regex: keyword, $options: "si" };
    }

    const initPagination = {
      page: 1,
      limitItems: 10,
    };

    if (req.query.limit) {
      initPagination.limitItems = parseInt(req.query.limit as string) || 10;
    }

    const totalRecord = await Subscriber.countDocuments(find);

    const pagination = Pagination(initPagination, req.query, totalRecord);

    const subscribers = await Subscriber.find(find)
      .sort({ subscribedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limitItems);

    res.status(200).json({
      code: 200,
      message: "Get subscribers successfully!",
      data: {
        subscribers,
        totalRecord,
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, error: "Failed to get subscribers" });
  }
};

//[PATCH] /admin/subscribers/:id
export const updateSentEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, isSent } = req.body;

    const subscriber = await Subscriber.findOneAndUpdate(
      {
        _id: id,
        email,
      },
      {
        isSent: !isSent,
      }
    );

    if (!subscriber) {
      res.status(404).json({ code: 404, error: "Subscriber not found" });
      return;
    }

    if (isSent) {
      // do something when email is sent
    }

    res.status(200).json({
      code: 200,
      message: "Update subscriber successfully!",
    });
  } catch (error) {
    res.status(500).json({ code: 500, error: "Failed to update subscriber" });
  }
};
