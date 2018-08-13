import { Request, Response } from "express";
import request from "request-promise-native";

import Controller from "../../../controller";

export default class ProjectController extends Controller {
  public async iterationAnalytics(req: Request, res: Response) {
    const projectId: string = req.params.projectId;
    const iteration: string = req.params.iteration;
  }
};
