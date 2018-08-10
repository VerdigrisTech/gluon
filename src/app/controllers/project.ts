import { Request, Response } from "express";
import request from "request-promise-native";

export let index = (req: Request, res: Response) => {
  res.send({});
};

export let iterationAnalytics = async (req: Request, res: Response) => {
  const projectId: string = req.params.projectId;
  const iteration: string = req.params.iteration;

};
