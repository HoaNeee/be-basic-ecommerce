import { Request, Response } from "express";
import Blog from "../../models/blog.model";
import Pagination from "../../../helpers/pagination";
import User from "../../models/user.model";

// [GET] /blogs
export const blogs = async (req: Request, res: Response) => {
  try {
    const { keyword, tag } = req.query;

    const filter: any = { deleted: false, status: "published" };

    if (tag) {
      filter.tags = { $in: [tag] };
    }
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { excerpt: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
        { tags: { $in: [new RegExp(keyword as string, "i")] } },
      ];
    }

    const totalRecord = await Blog.countDocuments(filter);

    const initPagination = {
      page: 1,
      limitItems: totalRecord,
    };

    if (req.query.limit) {
      initPagination.limitItems = Number(req.query.limit);
    }

    const objectPagination = Pagination(initPagination, req.query, totalRecord);

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(objectPagination.limitItems) * 1)
      .skip(Number(objectPagination.skip))
      .lean();

    const userIds = blogs.map((item) => item.user_id);
    const user = await User.find({
      _id: { $in: userIds },
      deleted: false,
    }).select("fullName avatar");

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
      message: "OK",
      data: {
        blogs,
        totalRecord,
        totalPage: objectPagination.totalPage,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

// [GET] /blogs/:slug
export const blogDetail = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({
      slug,
      deleted: false,
      status: "published",
    }).lean();

    const author = await User.findOne({
      _id: blog.user_id,
      deleted: false,
    }).select("fullName avatar");

    if (author) {
      blog["author"] = {
        fullName: author.fullName,
        avatar: author.avatar,
      };
    }

    if (!blog) {
      res.json({
        code: 404,
        message: "Blog not found",
      });
      return;
    }

    res.json({
      code: 200,
      message: "OK",
      data: blog,
    });
  } catch (error: any) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [GET] /blogs/tags
export const blogTags = async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.find(
      { deleted: false, status: "published" },
      { tags: 1 }
    );

    const tags = Array.from(new Set(blogs.flatMap((blog) => blog.tags)));

    res.json({
      code: 200,
      message: "OK",
      data: tags,
    });
  } catch (error: any) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [GET]  /blogs/related/:slug;
export const blogRelated = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug, deleted: false });
    if (!blog) {
      res.json({
        code: 404,
        message: "Blog not found",
      });
      return;
    }

    const relatedBlogs = await Blog.find({
      tags: { $in: blog.tags },
      deleted: false,
      status: "published",
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const userIds = relatedBlogs.map((item) => item.user_id);
    const users = await User.find({
      _id: { $in: userIds },
      deleted: false,
    }).select("fullName avatar");

    for (const blog of relatedBlogs) {
      const author =
        users.find((item) => item._id.toString() === blog.user_id.toString()) ||
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
      message: "OK",
      data: relatedBlogs,
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [GET]  /blogs/read/:slug;
export const readBlog = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug, deleted: false });
    if (!blog) {
      res.json({
        code: 404,
        message: "Blog not found",
      });
      return;
    }

    blog.view = (blog.view || 0) + 1;
    await blog.save();

    res.json({
      code: 200,
      message: "Read OK",
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [PATCH]  /blogs/like/:slug;
export const likeBlog = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { user_id } = req.body;

    const blog = await Blog.findOne({ slug, deleted: false });
    if (!blog) {
      res.json({
        code: 404,
        message: "Blog not found",
      });
      return;
    }

    if (!blog.liked) {
      blog.liked = [user_id];
    } else if (blog.liked.includes(user_id)) {
      blog.liked = blog.liked.filter((id) => id !== user_id);
    } else {
      blog.liked.push(user_id);
    }

    await blog.save();

    res.json({
      code: 200,
      message: "Like OK",
    });
  } catch (error) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};
