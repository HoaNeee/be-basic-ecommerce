import { Router } from "express";
import * as controller from "../../controllers/client/favorite.controller";

const router: Router = Router();

router.get("/", controller.products);

//products
router.get("/info", controller.getListFavoriteInfo);
router.post("/add", controller.addProduct);
router.delete("/remove/:product_id", controller.removeProduct);

//blogs
router.get("/blogs-info", controller.getListBlogSavedInfo);
router.post("/add-blog", controller.addBlog);
router.delete("/remove-blog/:blog_id", controller.removeBlog);

const favoriteRouter = router;
export default favoriteRouter;
