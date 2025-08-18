import { Response } from "express";
import { MyRequest } from "../../middlewares/client/auth.middleware";
import Product from "../../models/product.model";
import SubProduct from "../../models/subProduct.model";
import Favorite from "../../models/favorite.model";
import Supplier from "../../models/supplier.model";
import { solvePriceStock } from "../../../utils/product";
import Pagination from "../../../helpers/pagination";
import BlogSaved from "../../models/blogSaved.model";
import Blog from "../../models/blog.model";
import User from "../../models/user.model";

// [GET] /favorites
export const products = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const list = await Favorite.findOne({ user_id: user_id, deleted: false });

    if (!list) {
      res.json({
        code: 200,
        message: "OK",
        data: {
          products: [],
        },
      });
      return;
    }

    const listBlog = await BlogSaved.findOne({
      user_id: user_id,
      deleted: false,
    });

    res.json({
      code: 200,
      message: "OK",
      data: {
        list: list,
        listBlog: listBlog,
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

// [GET] /favorites/info
export const getListFavoriteInfo = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const list = await Favorite.findOne({ user_id: user_id, deleted: false });

    if (!list) {
      res.json({
        code: 200,
        message: "OK",
        data: {
          products: [],
        },
      });
      return;
    }

    const product_ids = list.products;

    const totalRecord = await Product.countDocuments({
      _id: { $in: product_ids },
      deleted: false,
    });

    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(initPagination, req.query, totalRecord);

    const products = await Product.find({
      _id: { $in: product_ids },
      deleted: false,
    })
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems)
      .lean();

    const subProducts = await SubProduct.find({
      product_id: { $in: product_ids },
      deleted: false,
    });

    for (const product of products) {
      if (product.productType === "variations") {
        const subs = subProducts.filter(
          (sub) => sub.product_id === String(product._id)
        );
        solvePriceStock(product, subs);
      }
      const supplier = await Supplier.findOne({ _id: product.supplier_id });
      if (supplier) {
        product["supplierName"] = supplier.name;
      }
    }

    res.json({
      code: 200,
      message: "Favorite OK!",
      data: {
        products,
        totalRecord,
        totalPage: objectPagination.totalPage,
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

// [POST] /favorites/add
export const addProduct = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const list = body.listFavorite;

    const favorite = await Favorite.findOne({ user_id: user_id });

    if (!favorite) {
      const newFavorite = new Favorite({
        products: list,
        user_id: user_id,
      });

      await newFavorite.save();
    } else {
      favorite.products = [...list];
      await favorite.save();
    }

    res.json({
      code: 200,
      message: "Added!",
      data: {},
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [DELETE] /favorites/remove/:product_id
export const removeProduct = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const product_id = req.params.product_id;

    if (!product_id) {
      throw Error("Missing product_id");
    }

    const favorite = await Favorite.findOne({ user_id: user_id });

    if (!favorite) {
      throw Error("Not found!");
    }

    favorite.products = [
      ...favorite.products.filter((item) => item !== product_id),
    ];

    await favorite.save();

    res.json({
      code: 200,
      message: "Removed!",
      data: {},
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

// [GET] /favorites/blogs-info
export const getListBlogSavedInfo = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const list = await BlogSaved.findOne({ user_id: user_id, deleted: false });

    if (!list) {
      res.json({
        code: 200,
        message: "OK",
        data: {
          blogs: [],
        },
      });
      return;
    }

    const blog_ids = list.blogs;

    const totalRecord = await Blog.countDocuments({
      _id: { $in: blog_ids },
      deleted: false,
    });

    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(initPagination, req.query, totalRecord);

    const blogs = await Blog.find({
      _id: { $in: blog_ids },
      deleted: false,
    })
      .skip(objectPagination.skip)
      .limit(objectPagination.limitItems)
      .lean();

    const userIds = blogs.map((item) => item.user_id);
    const user = await User.find({ _id: { $in: userIds } });
    for (const blog of blogs) {
      const author =
        user.find((item) => item._id.toString() === blog.user_id.toString()) ||
        null;
      delete blog.user_id;
      if (author) {
        blog["author"] = {
          fullName: author.fullName,
          avatar: author.avatar,
        };
      }
    }

    res.json({
      code: 200,
      message: "Blogs info OK!",
      data: {
        blogs,
        totalRecord,
        totalPage: objectPagination.totalPage,
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

// [POST] /favorites/add-blog
export const addBlog = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const body = req.body;

    const list = body.listBlog;

    const blogSaveds = await BlogSaved.findOne({ user_id: user_id });

    if (!blogSaveds) {
      const newBlogSaved = new BlogSaved({
        blogs: list,
        user_id: user_id,
      });

      await newBlogSaved.save();
    } else {
      blogSaveds.blogs = [...list];
      await blogSaveds.save();
    }

    res.json({
      code: 200,
      message: "Added!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 500,
      message: error.message || error,
    });
  }
};

// [DELETE] /favorites/remove-blog/:blog_id
export const removeBlog = async (req: MyRequest, res: Response) => {
  try {
    const user_id = req.userId;

    const blog_id = req.params.blog_id;

    if (!blog_id) {
      throw Error("Missing blog_id");
    }

    const blogSaveds = await BlogSaved.findOneAndUpdate(
      { user_id: user_id },
      { $pull: { blogs: blog_id } }
    );

    if (!blogSaveds) {
      res.json({
        code: 404,
        message: "Not found!",
      });
      return;
    }

    res.json({
      code: 200,
      message: "Removed!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: 500,
      message: error.message || error,
    });
  }
};
