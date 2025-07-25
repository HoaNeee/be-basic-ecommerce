import { Router } from "express";

const router = Router();

import * as controller from "../../controllers/client/blog.controller";

router.get("/", controller.blogs);
router.get("/tags", controller.blogTags);
router.get("/detail/:slug", controller.blogDetail);
router.get("/related/:slug", controller.blogRelated);
router.get("/read/:slug", controller.readBlog);
router.patch("/like/:slug", controller.likeBlog);

const blogRouter = router;
export default blogRouter;
