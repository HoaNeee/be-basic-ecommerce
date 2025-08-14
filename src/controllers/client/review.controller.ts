import { Request, Response } from "express";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Review from "../../models/review.model";
import Comment from "../../models/comment.model";
import Customer from "../../models/customer.model";
import Pagination from "../../../helpers/pagination";

// [GET] /reviews
export const reviews = async (req: MyRequest, res: Response) => {
  try {
    const product_id = req.query.product_id;
    const limit = Number(req.query.limit) || 3;
    const page = Number(req.query.page) || 1;

    const skip = (page - 1) * limit;

    const totalRecord = await Review.countDocuments({
      product_id: product_id,
      deleted: false,
    });

    const reviews = await Review.find({
      product_id: product_id,
      deleted: false,
    })
      .limit(limit)
      .skip(skip)
      .lean();

    for (const item of reviews) {
      const commentCnt = await Comment.countDocuments({
        review_id: item._id,
        deleted: false,
        parent_id: "",
      });
      const user = await Customer.findOne({
        _id: item.user_id,
        deleted: false,
      }).select("firstName lastName avatar");
      item["user"] = user;
      item[`countComment`] = commentCnt;
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        reviews,
        totalRecord,
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

// [GET] /reviews/comments/:review_id
export const getComments = async (req: MyRequest, res: Response) => {
  try {
    const review_id = req.params.review_id;
    const parent_id = req.query?.parent_id || "";

    const comments = await Comment.find({
      review_id: review_id,
      parent_id: parent_id,
      deleted: false,
    }).lean();

    for (const comment of comments) {
      const countComment = await Comment.countDocuments({
        parent_id: comment._id,
        deleted: false,
      });
      const user = await Customer.findOne({
        _id: comment.user_id,
        deleted: false,
      }).select("firstName lastName avatar");

      comment[`countComment`] = countComment;
      comment[`user`] = user;
    }

    res.json({
      code: 200,
      message: "OK",
      data: comments,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /reviews/create
export const create = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const review = new Review({
      ...body,
      user_id: user_id,
    });

    await review.save();

    res.json({
      code: 200,
      message: "Submited!",
      data: review,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [POST] /reviews/create-comment
export const createComment = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const comment = new Comment({
      ...body,
      user_id: user_id,
    });

    await comment.save();

    res.json({
      code: 200,
      message: "Post success!",
      data: comment,
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [PATCH] /reviews/edit/:id
export const edit = async (req: MyRequest, res: Response) => {
  try {
    //Do something...
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

// [DELETE] /reviews/delete-comment/:id
export const removeCommentUser = async (req: MyRequest, res: Response) => {
  try {
    const comment_id = req.params.id;
    const user_id = req.userId;

    if (!comment_id) {
      throw Error("Missing comment_id");
    }

    await Comment.deleteMany({ parent_id: comment_id });
    await Comment.deleteOne({ _id: comment_id, user_id });

    res.json({
      code: 200,
      message: "Deleted!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [DELETE] /reviews/delete/:id
export const removeReviewUser = async (req: MyRequest, res: Response) => {
  try {
    const review_id = req.params.id;
    const user_id = req.userId;

    if (!review_id) {
      throw Error("Missing review_id");
    }

    await Comment.deleteMany({ review_id: review_id });
    await Review.deleteOne({ _id: review_id, user_id });

    res.json({
      code: 200,
      message: "Deleted!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [GET] /reviews/top-reviews
export const topReviews = async (req: MyRequest, res: Response) => {
  try {
    const totalRecord = await Review.countDocuments({ deleted: false });
    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objPagination = Pagination(initPagination, req.query, totalRecord);

    const reviews = await Review.aggregate([
      { $match: { deleted: false } },

      {
        $addFields: {
          contentLength: { $strLenCP: "content" },
          user_object_id: { $toObjectId: "$user_id" },
        },
      },
      { $sort: { star: -1, contentLength: -1 } },
      { $limit: objPagination.limitItems },
      { $skip: objPagination.skip },
      {
        $lookup: {
          from: "customers",
          localField: "user_object_id",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$user" },
    ]);

    res.json({
      code: 200,
      message: "Top reviews OK",
      data: {
        reviews,
        totalRecord,
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
