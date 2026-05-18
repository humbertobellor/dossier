import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import releasesRouter from "./releases";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(releasesRouter);

export default router;
