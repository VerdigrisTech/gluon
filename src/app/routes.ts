import { Router } from "express";
import * as projectController from "./controllers/project";

const router = Router();

router.get('/projects/:projectId/iterations/:iteration/analytics', projectController.iterationAnalytics);

export default router;
