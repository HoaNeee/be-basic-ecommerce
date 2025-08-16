import { Request, Response } from "express";
import Subscriber from "../../models/subscriber.model";
import Pagination from "../../../helpers/pagination";

//[GET] /admin/subscribers
export const getSubscribers = async (req: Request, res: Response) => {
  try {
    const find = {};

    const keyword = req.query.keyword as string;
    const status = req.query.status;

    if (status && status !== "all") {
      find["status"] = status;
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

//[GET] /admin/subscribers/stats
export const getSubscribersStats = async (req: Request, res: Response) => {
  try {
    const totalSubscribers = await Subscriber.countDocuments();
    const sentSubscribers = await Subscriber.countDocuments({ status: "sent" });
    const notSentSubscribers = await Subscriber.countDocuments({
      status: "not-sent",
    });
    const cancelSubscribers = await Subscriber.countDocuments({
      status: "cancel",
    });

    res.status(200).json({
      code: 200,
      message: "Get subscribers stats successfully!",
      data: {
        totalSubscribers,
        sentSubscribers,
        notSentSubscribers,
        cancelSubscribers,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ code: 500, error: "Failed to get subscribers stats" });
  }
};

//[PATCH] /admin/subscribers/:id
export const updateSentEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const subscriber = await Subscriber.findOneAndUpdate(
      {
        _id: id,
        email,
      },
      {
        status: "sent",
      },
      {
        new: true,
      }
    );

    if (!subscriber) {
      res.status(404).json({ code: 404, error: "Subscriber not found" });
      return;
    }

    if (subscriber.status === "sent") {
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

//[PATCH] /admin/subscribers/bulk
export const updateBulk = async (req: Request, res: Response) => {
  try {
    const ids = req.body.ids;
    const action = req.body.action;

    const subscribers = await Subscriber.updateMany(
      {
        _id: { $in: ids },
      },
      {
        status: action,
      }
    );

    if (!subscribers) {
      res.status(404).json({ code: 404, error: "Subscribers not found" });
      return;
    }

    if (action === "sent") {
      //sent mail here...
    }

    res.status(200).json({
      code: 200,
      message: "Update subscribers successfully!",
    });
  } catch (error) {
    res.status(500).json({ code: 500, error: "Failed to update subscribers" });
  }
};

//[PATCH] /admin/subscribers/send-all
export const updateSentAll = async (req: Request, res: Response) => {
  try {
    const subscribers = await Subscriber.updateMany(
      {
        $or: [{ status: "not-sent" }, { status: "sent" }],
      },
      {
        status: "sent",
      }
    );

    if (!subscribers) {
      res.status(404).json({ code: 404, error: "Subscribers not found" });
      return;
    }

    //sent mail here

    res.status(200).json({
      code: 200,
      message: "Update subscribers successfully!",
    });
  } catch (error) {
    res.status(500).json({ code: 500, error: "Failed to update subscribers" });
  }
};
