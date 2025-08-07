import { Router } from "express";
import * as controller from "../../controllers/admin/AIAssistant.controller";

const router = Router();

router.post("/blog", controller.aiAssistantBlog);
router.post("/product", controller.aiAssistantProduct);

const aiAssistantRouter = router;
export default aiAssistantRouter;
