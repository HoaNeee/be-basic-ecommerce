import { Router } from "express";
import * as controller from "../../controllers/admin/blog.controller";
const router = Router();

router.get("/", controller.blogs);
router.get("/stats", controller.stats);
router.get("/tags", controller.blogTags);
router.patch("/change-multi", controller.changeMulti);
router.post("/", controller.create);
router.get("/:id", controller.blogDetail);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

const blogRouter = router;

export default blogRouter;
