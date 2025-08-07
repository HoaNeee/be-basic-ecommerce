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
exports.removeTag = exports.changeMulti = exports.stats = exports.remove = exports.update = exports.create = exports.blogTags = exports.blogDetail = exports.blogs = void 0;
const blog_model_1 = __importDefault(require("../../models/blog.model"));
const blogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const filter = { deleted: false };
        if (status && status !== "all") {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { excerpt: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } },
            ];
        }
        const blogs = yield blog_model_1.default.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = yield blog_model_1.default.countDocuments(filter);
        res.json({
            code: 200,
            message: "OK",
            data: {
                blogs,
                total,
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
        const { id } = req.params;
        const blog = yield blog_model_1.default.findOne({
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
        const blogs = yield blog_model_1.default.find({ deleted: false }, { tags: 1 });
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
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const blog = new blog_model_1.default(blogData);
        yield blog.save();
        res.json({
            code: 201,
            message: "Blog created successfully",
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
exports.create = create;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (updateData.content && !updateData.readTime) {
            updateData.readTime = calculateReadTime(updateData.content);
        }
        const blog = yield blog_model_1.default.findOneAndUpdate({ _id: id, deleted: false }, updateData);
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
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.update = update;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const blog = yield blog_model_1.default.findOneAndUpdate({ _id: id, deleted: false }, {
            deleted: true,
            deletedAt: new Date().toISOString(),
        }, { new: true });
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
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message,
        });
    }
});
exports.remove = remove;
const stats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const total = yield blog_model_1.default.countDocuments({ deleted: false });
        const published = yield blog_model_1.default.countDocuments({
            deleted: false,
            status: "published",
        });
        const draft = yield blog_model_1.default.countDocuments({
            deleted: false,
            status: "draft",
        });
        const blogs = yield blog_model_1.default.find({ deleted: false }, { readTime: 1 });
        const totalReadTime = blogs.reduce((sum, blog) => sum + (blog.readTime || 0), 0);
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
    }
    catch (error) {
        res.status(500).json({
            code: 500,
            message: error.message,
        });
    }
});
exports.stats = stats;
const changeMulti = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ids = req.body.ids;
        const type = req.query.type;
        switch (type) {
            case "delete":
                yield blog_model_1.default.updateMany({ _id: { $in: ids }, deleted: false }, {
                    deleted: true,
                    deletedAt: new Date(),
                });
                res.json({
                    code: 200,
                    message: "Blogs deleted successfully",
                });
                break;
            case "publish":
                yield blog_model_1.default.updateMany({ _id: { $in: ids }, deleted: false }, {
                    status: "published",
                });
                res.json({
                    code: 200,
                    message: "Blogs published successfully",
                });
                break;
            case "draft":
                yield blog_model_1.default.updateMany({ _id: { $in: ids }, deleted: false }, {
                    status: "draft",
                });
                res.json({
                    code: 200,
                    message: "Blogs moved to draft successfully",
                });
                break;
        }
    }
    catch (error) {
        res.json({
            code: 500,
            message: error.message,
        });
    }
});
exports.changeMulti = changeMulti;
const removeTag = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tag } = req.params;
        if (!tag) {
            res.json({
                code: 400,
                message: "Tag is required",
            });
            return;
        }
        yield blog_model_1.default.updateMany({
            tags: tag,
            deleted: false,
        }, {
            $pull: { tags: tag },
        });
        res.json({
            code: 200,
            message: "Tag deleted successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            code: 500,
            message: error.message,
        });
    }
});
exports.removeTag = removeTag;
function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}
