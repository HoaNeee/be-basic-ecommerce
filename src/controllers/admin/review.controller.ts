import { Request, Response } from "express";
import Review from "../../models/review.model";
import Comment from "../../models/comment.model";
import Customer from "../../models/customer.model";
import Product from "../../models/product.model";
import Pagination from "../../../helpers/pagination";

// [GET] /reviews
export const index = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: false,
    };

    let find_customers: any = {
      deleted: false,
    };
    const keyword = req.query.keyword || "";

    if (keyword) {
      find_customers = {
        ...find_customers,
        $or: [
          { firstName: { $regex: keyword, $options: "si" } },
          { lastName: { $regex: keyword, $options: "si" } },
        ],
      };
    }

    const customers = await Customer.find(find_customers);

    const cus_ids = customers.map((item) => item.id);

    if (keyword) {
      find["user_id"] = { $in: cus_ids };
    }

    const totalRecord = await Review.countDocuments(find);

    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objPagination = Pagination(initPagination, req.query, totalRecord);

    const reviews = await Review.find(find)
      .skip(objPagination.skip)
      .limit(objPagination.limitItems)
      .lean();

    const productIds = reviews.map((item) => item.product_id);
    const rvIds = reviews.map((item) => String(item._id));

    const comments = await Comment.find({
      deleted: false,
      review_id: { $in: rvIds },
    });

    const products = await Product.find({ _id: { $in: productIds } });

    for (const review of reviews) {
      const cus = customers.find((item) => String(item.id) === review.user_id);
      const product = products.find((item) => item.id === review.product_id);

      if (cus) {
        review["product"] = product.toObject();
        review["customer"] = cus.toObject();
        review["commentCount"] = comments.filter(
          (it) => it.review_id === String(review._id)
        ).length;
      }
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
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [DELETE] /reviews/delete/:id
export const remove = async (req: Request, res: Response) => {
  try {
    const rv_id = req.params.id;

    if (!rv_id) {
      throw Error("Missing _id");
    }

    await Comment.deleteMany({ review_id: rv_id });

    await Review.deleteOne({ _id: rv_id });

    res.json({
      code: 200,
      message: "Delete review success!",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [GET] /reviews/comments/:id
export const getComments = async (req: Request, res: Response) => {
  try {
    const review_id = req.params.id;

    if (!review_id) {
      throw Error("Missing _id");
    }

    let find: any = {
      deleted: false,
      review_id,
    };

    // let find_customers: any = {
    //   deleted: false,
    // };
    // const keyword = req.query.keyword || "";

    // if (keyword) {
    //   find_customers = {
    //     ...find_customers,
    //     $or: [
    //       { firstName: { $regex: keyword, $options: "si" } },
    //       { lastName: { $regex: keyword, $options: "si" } },
    //     ],
    //   };
    // }

    // const customers = await Customer.find(find_customers);

    // const cus_ids = customers.map((item) => item.id);

    // if (keyword) {
    //   find["user_id"] = { $in: cus_ids };
    // }

    const totalRecord = await Comment.countDocuments(find);

    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objPagination = Pagination(initPagination, req.query, totalRecord);

    const comments = await Comment.find(find)
      .skip(objPagination.skip)
      .limit(objPagination.limitItems)
      .lean();

    const cus_ids = comments.map((item) => item.user_id);

    const customers = await Customer.find({ _id: { $in: cus_ids } }).lean();

    for (const comment of comments) {
      const cus = customers.find((item) => String(item._id));
      if (cus) {
        comment["customer"] = cus;
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        comments,
        totalRecord,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [DELETE] /reviews/comments/delete/:id
export const removeComment = async (req: Request, res: Response) => {
  try {
    const comment_id = req.params.id;

    if (!comment_id) {
      throw Error("Missing _id");
    }

    await Comment.deleteMany({ parent_id: comment_id });

    await Comment.deleteOne({ _id: comment_id });

    res.json({
      code: 200,
      message: "Deleted!!",
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      code: 400,
      message: error.message,
    });
  }
};
