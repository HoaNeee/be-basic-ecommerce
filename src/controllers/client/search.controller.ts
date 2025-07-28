import { Request, Response } from "express";
import Pagination from "../../../helpers/pagination";
import Product from "../../models/product.model";
import Blog from "../../models/blog.model";
import SubProduct from "../../models/subProduct.model";
import User from "../../models/user.model";
import { solvePriceStock } from "../../../utils/product";
import Supplier from "../../models/supplier.model";

// [GET] /search
export const search = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;

    const input = convertInput(keyword as string);

    const products = await Product.find({
      $text: { $search: input },
      deleted: false,
    })
      .limit(12)
      .lean();

    const blogs = await Blog.find({
      $text: { $search: input },
      deleted: false,
      status: "published",
    })
      .limit(5)
      .lean();

    const productIds = products.map((pro) => pro._id.toString());
    const supplier_ids = products.map((pro) => pro.supplier_id.toString());

    const suppliers = await Supplier.find({
      _id: { $in: supplier_ids },
      deleted: false,
    });

    const authorIds = blogs.map((blog) => blog.user_id.toString());

    const subProducts = await SubProduct.find({
      product_id: { $in: productIds },
      deleted: false,
    });

    const authors = await User.find({
      _id: { $in: authorIds },
    }).select("fullName avatar email");

    for (const product of products) {
      const supplier = suppliers.find(
        (supplier) => String(supplier._id) === product.supplier_id.toString()
      );
      product["supplierName"] = supplier.name || "Unknown";

      const subs = subProducts.filter(
        (sub) => sub.product_id === String(product._id)
      );
      if (subs.length > 0) {
        solvePriceStock(product, subs);
      }
    }

    const response = [];

    response.push({
      type: "products",
      data: products.map((product) => {
        return {
          ...product,
          //totalPage,
          //totalRecord,
        };
      }),
    });

    response.push({
      type: "blogs",
      data: blogs.map((blog) => {
        const author = authors.find(
          (author) => String(author._id) === blog.user_id.toString()
        );
        if (author) {
          delete author._id;
        }
        return {
          ...blog,
          type: "blogs",
          author: author,
        };
      }),
    });

    res.json({
      code: 200,
      message: "Search OK",
      data: response,
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [GET] /search/suggest
export const suggest = async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;

    const convertedKeyword: any = convertInput(keyword as string);

    const options = "sixum";

    const wordProductsFilters = convertedKeyword.split(" ").map((w) => {
      return {
        $or: [
          { title: { $regex: w, $options: options } },
          { shortDescription: { $regex: w, $options: options } },
          { SKU: { $regex: w, $options: options } },
          { slug: { $regex: w, $options: options } },
        ],
      };
    });

    const suggestsProduct = await Product.find({
      deleted: false,
      $and: wordProductsFilters,
    })
      .limit(10)
      .select("title shortDescription SKU")
      .lean();

    const wordBlogsFilters = convertedKeyword.split(" ").map((w) => {
      return {
        $or: [
          { title: { $regex: w, $options: options } },
          { excerpt: { $regex: w, $options: options } },
          { slug: { $regex: w, $options: options } },
        ],
      };
    });

    const suggestsBlogs = await Blog.find({
      deleted: false,
      status: "published",
      $and: wordBlogsFilters,
    })
      .limit(2)
      .select("title excerpt")
      .lean();

    const response = [];
    const productSet = new Set();
    let limit = 5;
    for (const sugProduct of suggestsProduct) {
      delete sugProduct._id;
      for (const key in sugProduct) {
        const cv = convertInput(sugProduct[key]);
        if (cv.includes(convertedKeyword) && !productSet.has(cv) && limit > 0) {
          response.push(
            sugProduct[key].replace(/-/g, " ").replace(/\s+/g, " ")
          );
          productSet.add(cv);
          --limit;
          break;
        }
      }
    }

    for (const sugBlog of suggestsBlogs) {
      delete sugBlog._id;
      for (const key in sugBlog) {
        const cv = convertInput(sugBlog[key]);
        if (cv.includes(convertedKeyword)) {
          response.push(sugBlog[key].replace(/-/g, " ").replace(/\s+/g, " "));
          break;
        }
      }
    }

    res.json({
      code: 200,
      message: "Suggest OK",
      data: response,
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

const convertInput = (input: string) => {
  function removeVietnameseTones(str: string): string {
    return (
      str
        .normalize("NFD") // split characters with diacritics
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D") // replace 'đ' with 'd' and 'Đ' with 'D'
        // .replace(/[^a-zA-Z0-9\s]/g, "") // remove special characters
        .trim() // remove leading and trailing whitespace
        .replace(/\s+/g, " ") // replace multiple spaces with a single space
        .toLowerCase()
    ); // convert to lowercase
  }

  return removeVietnameseTones(input);
};
