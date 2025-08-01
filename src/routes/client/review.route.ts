import { Router } from "express";
import * as controller from "../../controllers/client/review.controller";
import * as authMiddleware from "../../middlewares/client/auth.middleware";

const router: Router = Router();

router.get("/", controller.reviews);
router.get("/comments/:review_id", controller.getComments);
router.get("/top-reviews", controller.topReviews);

router.post("/create", authMiddleware.isAccess, controller.create);
router.post(
  "/create-comment",
  authMiddleware.isAccess,
  controller.createComment
);
router.delete(
  "/delete-comment/:id",
  authMiddleware.isAccess,
  controller.removeComment
);
router.delete("/delete/:id", authMiddleware.isAccess, controller.removeReview);

const reviewRouter = router;
export default reviewRouter;
