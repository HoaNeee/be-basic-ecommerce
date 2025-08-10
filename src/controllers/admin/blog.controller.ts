import { Request, Response } from "express";
import Blog from "../../models/blog.model";
import { MyRequest } from "../../middlewares/admin/auth.middleware";
import Pagination from "../../../helpers/pagination";
import User from "../../models/user.model";

// [GET] /admin/blogs
export const blogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const filter: any = { deleted: false };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } },
      ];
    }

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Blog.countDocuments(filter);

    res.json({
      code: 200,
      message: "OK",
      data: {
        blogs,
        total,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

// [GET] /admin/blogs/:id
export const blogDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findOne({
      _id: id,
      deleted: false,
    });

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

// [GET] /admin/blogs/tags
export const blogTags = async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.find({ deleted: false }, { tags: 1 });
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

// [POST] /admin/blogs
export const create = async (req: MyRequest, res: Response) => {
  try {
    const { title, excerpt, content, image, tags, readTime, status } = req.body;

    const user_id = req.userId || "admin";

    const blogData = {
      user_id,
      title,
      excerpt,
      content,
      image,
      tags: Array.isArray(tags) ? tags : [],
      readTime: readTime || calculateReadTime(content),
      status: status || "draft",
    };

    const blog = new Blog(blogData);
    await blog.save();

    res.json({
      code: 201,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error: any) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [PATCH] /admin/blogs/:id
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Auto-calculate read time if content is updated
    if (updateData.content && !updateData.readTime) {
      updateData.readTime = calculateReadTime(updateData.content);
    }

    const blog = await Blog.findOneAndUpdate(
      { _id: id, deleted: false },
      updateData
    );

    if (!blog) {
      res.json({
        code: 404,
        message: "Blog not found",
      });
      return;
    }

    res.json({
      code: 200,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error: any) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [DELETE] /admin/blogs/:id
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findOneAndUpdate(
      { _id: id, deleted: false },
      {
        deleted: true,
        deletedAt: new Date().toISOString(),
      },
      { new: true }
    );

    if (!blog) {
      res.json({
        code: 404,
        message: "Blog not found",
      });
      return;
    }

    res.json({
      code: 200,
      message: "Blog deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

// [GET] /admin/blogs/stats
export const stats = async (req: Request, res: Response) => {
  try {
    const total = await Blog.countDocuments({ deleted: false });
    const published = await Blog.countDocuments({
      deleted: false,
      status: "published",
    });
    const draft = await Blog.countDocuments({
      deleted: false,
      status: "draft",
    });

    // Calculate total read time
    const blogs = await Blog.find({ deleted: false }, { readTime: 1 });
    const totalReadTime = blogs.reduce(
      (sum, blog) => sum + (blog.readTime || 0),
      0
    );

    res.json({
      code: 200,
      message: "OK",
      data: {
        total,
        published,
        draft,
        totalReadTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

//[PATCH] /admin/blogs/change-multi
export const changeMulti = async (req: MyRequest, res: Response) => {
  try {
    const ids = req.body.ids;

    const type = req.query.type as string;

    switch (type) {
      case "delete":
        await Blog.updateMany(
          { _id: { $in: ids }, deleted: false },
          {
            deleted: true,
            deletedAt: new Date(),
          }
        );
        res.json({
          code: 200,
          message: "Blogs deleted successfully",
        });
        break;
      case "publish":
        await Blog.updateMany(
          { _id: { $in: ids }, deleted: false },
          {
            status: "published",
          }
        );
        res.json({
          code: 200,
          message: "Blogs published successfully",
        });
        break;
      case "draft":
        await Blog.updateMany(
          { _id: { $in: ids }, deleted: false },
          {
            status: "draft",
          }
        );
        res.json({
          code: 200,
          message: "Blogs moved to draft successfully",
        });
        break;
    }
  } catch (error: any) {
    res.json({
      code: 500,
      message: error.message,
    });
  }
};

// [DELETE] /admin/blogs/tags/:tag
export const removeTag = async (req: Request, res: Response) => {
  try {
    const { tag } = req.params;
    if (!tag) {
      res.json({
        code: 400,
        message: "Tag is required",
      });
      return;
    }

    await Blog.updateMany(
      {
        tags: tag,
        deleted: false,
      },
      {
        $pull: { tags: tag },
      }
    );

    res.json({
      code: 200,
      message: "Tag deleted successfully",
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

// [GET] /admin/blogs/trash
export const blogTrash = async (req: Request, res: Response) => {
  try {
    let find: any = {
      deleted: true,
    };

    const initialPagination = {
      page: 1,
      limitItems: 10,
    };

    if (req.query.limit) {
      initialPagination.limitItems = parseInt(req.query.limit as string) || 10;
    }

    const totalRecord = await Blog.countDocuments(find);

    const pagination = Pagination(initialPagination, req.query, totalRecord);

    const blogs = await Blog.find(find)
      .skip(pagination.skip)
      .limit(pagination.limitItems)
      .sort({ deletedAt: -1 })
      .lean();

    const authors = await User.find({
      _id: { $in: blogs.map((blog) => blog.user_id) },
    }).select("fullName email");

    for (const blog of blogs) {
      const author = authors.find(
        (author) => String(author._id) === blog.user_id
      );
      if (author) {
        blog["author"] = author;
      }
    }

    res.json({
      code: 200,
      message: "OK",
      data: {
        blogs,
        totalRecord,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

//[PATCH] /blogs/change-trash/:blogId
export const changeTrashOne = async (req: Request, res: Response) => {
  try {
    const blog_id = req.params.blogId;
    const type = req.query.type as string;

    if (!blog_id) {
      res.status(400).json({
        code: 400,
        message: "Blog ID is required",
      });
      return;
    }

    if (type === "delete") {
      await Blog.deleteOne({ _id: blog_id, deleted: true });
    } else if (type === "restore") {
      await Blog.findByIdAndUpdate(blog_id, {
        deleted: false,
        deletedAt: null,
      });
    }

    res.status(200).json({
      code: 200,
      message: `Blog ${
        type === "delete" ? "deleted" : "restored"
      } successfully`,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[PATCH] /blogs/bulk-trash
export const bulkChangeTrash = async (req: Request, res: Response) => {
  try {
    const action = req.query.action as string;
    const ids = req.body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        code: 400,
        message: "Invalid IDs",
      });
      return;
    }

    switch (action) {
      case "delete":
        await Blog.deleteMany({ _id: { $in: ids }, deleted: true });
        break;
      case "restore":
        await Blog.updateMany(
          { _id: { $in: ids }, deleted: true },
          {
            deleted: false,
            deletedAt: null,
          }
        );
        break;
      default:
        res.status(400).json({
          code: 400,
          message: "Invalid action",
        });
        return;
    }

    res.status(200).json({
      code: 200,
      message: `Blogs ${
        action === "delete" ? "deleted" : "restored"
      } successfully`,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

//[PATCH] /products/change-trash-all
export const changeTrashAll = async (req: Request, res: Response) => {
  try {
    const action = req.query.action as string;

    if (!action) {
      res.status(400).json({
        code: 400,
        message: "Action is required",
      });
      return;
    }

    if (action === "delete") {
      await Blog.deleteMany({ deleted: true });
    } else if (action === "restore") {
      await Blog.updateMany(
        { deleted: true },
        {
          deleted: false,
          deletedAt: null,
        }
      );
    }

    res.status(200).json({
      code: 200,
      message: `Blogs ${
        action === "delete" ? "deleted" : "restored"
      } successfully`,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message || error,
    });
  }
};

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
