import { Router } from "express";
import * as controller from "../../controllers/admin/blog.controller";
const router = Router();

router.get("/", controller.blogs);
router.get("/stats", controller.stats);
router.get("/tags", controller.blogTags);
router.get("/trash", controller.blogTrash);
router.get("/:id", controller.blogDetail);

router.post("/", controller.create);

router.patch("/change-multi", controller.changeMulti);
router.patch("/change-trash/:blogId", controller.changeTrashOne);
router.patch("/bulk-trash", controller.bulkChangeTrash);
router.patch("/change-trash-all", controller.changeTrashAll);
router.patch("/edit/:id", controller.update);

router.delete("/:id", controller.remove);
router.delete("/tags/:tag", controller.removeTag);

const blogRouter = router;

export default blogRouter;
