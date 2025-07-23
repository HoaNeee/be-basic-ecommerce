import { Router } from "express";
import multer from "multer";

const upload = multer();

import * as controller from "../../controllers/client/upload.controller";

const router = Router();

router.post("/", upload.single("thumbnail"), controller.upload);
router.post("/multi", upload.array("images"), controller.uploads);

const uploadRouter = router;

export default uploadRouter;
