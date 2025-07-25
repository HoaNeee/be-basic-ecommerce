"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeBlog = exports.readBlog = exports.blogRelated = exports.blogTags = exports.blogDetail = exports.blogs = void 0;
const blog_model_1 = __importDefault(require("../../models/blog.model"));
const pagination_1 = __importDefault(require("../../../helpers/pagination"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const blogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, tag } = req.query;
        const filter = { deleted: false, status: "published" };
        if (tag) {
            filter.tags = { $in: [tag] };
        }
        if (keyword) {
            filter.$or = [
                { title: { $regex: keyword, $options: "i" } },
                { excerpt: { $regex: keyword, $options: "i" } },
                { content: { $regex: keyword, $options: "i" } },
                { tags: { $in: [new RegExp(keyword, "i")] } },
            ];
        }
        const totalRecord = yield blog_model_1.default.countDocuments(filter);
        const initPagination = {
            page: 1,
            limitItems: totalRecord,
        };
        if (req.query.limit) {
            initPagination.limitItems = Number(req.query.limit);
        }
        const objectPagination = (0, pagination_1.default)(initPagination, req.query, totalRecord);
        const blogs = yield blog_model_1.default.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(objectPagination.limitItems) * 1)
            .skip(Number(objectPagination.skip))
            .lean();
        const userIds = blogs.map((item) => item.user_id);
        const user = yield user_model_1.default.find({
            _id: { $in: userIds },
            deleted: false,
        }).select("fullName avatar");
        for (const blog of blogs) {
            const author = user.find((item) => item._id.toString() === blog.user_id.toString()) ||
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
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message,
        });
    }
});
exports.blogs = blogs;
const blogDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slug } = req.params;
        const blog = yield blog_model_1.default.findOne({
            slug,
            deleted: false,
            status: "published",
        }).lean();
        const author = yield user_model_1.default.findOne({
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
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.blogDetail = blogDetail;
const blogTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blogs = yield blog_model_1.default.find({ deleted: false, status: "published" }, { tags: 1 });
        const tags = Array.from(new Set(blogs.flatMap((blog) => blog.tags)));
        res.json({
            code: 200,
            message: "OK",
            data: tags,
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.blogTags = blogTags;
const blogRelated = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slug } = req.params;
        const blog = yield blog_model_1.default.findOne({ slug, deleted: false });
        if (!blog) {
            res.json({
                code: 404,
                message: "Blog not found",
            });
            return;
        }
        const relatedBlogs = yield blog_model_1.default.find({
            tags: { $in: blog.tags },
            deleted: false,
            status: "published",
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        const userIds = relatedBlogs.map((item) => item.user_id);
        const users = yield user_model_1.default.find({
            _id: { $in: userIds },
            deleted: false,
        }).select("fullName avatar");
        for (const blog of relatedBlogs) {
            const author = users.find((item) => item._id.toString() === blog.user_id.toString()) ||
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
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.blogRelated = blogRelated;
const readBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slug } = req.params;
        const blog = yield blog_model_1.default.findOne({ slug, deleted: false });
        if (!blog) {
            res.json({
                code: 404,
                message: "Blog not found",
            });
            return;
        }
        blog.view = (blog.view || 0) + 1;
        yield blog.save();
        res.json({
            code: 200,
            message: "Read OK",
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.readBlog = readBlog;
const likeBlog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slug } = req.params;
        const { user_id } = req.body;
        const blog = yield blog_model_1.default.findOne({ slug, deleted: false });
        if (!blog) {
            res.json({
                code: 404,
                message: "Blog not found",
            });
            return;
        }
        if (!blog.liked) {
            blog.liked = [user_id];
        }
        else if (blog.liked.includes(user_id)) {
            blog.liked = blog.liked.filter((id) => id !== user_id);
        }
        else {
            blog.liked.push(user_id);
        }
        yield blog.save();
        res.json({
            code: 200,
            message: "Like OK",
        });
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.likeBlog = likeBlog;
