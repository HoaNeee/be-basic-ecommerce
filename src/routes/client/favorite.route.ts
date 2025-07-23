import { Router } from "express";
import * as controller from "../../controllers/client/favorite.controller";

const router: Router = Router();

router.get("/", controller.index);
router.get("/info", controller.getListFavoriteInfo);
router.post("/add", controller.addProduct);
router.delete("/remove/:product_id", controller.removeProduct);

const favoriteRouter = router;
export default favoriteRouter;
