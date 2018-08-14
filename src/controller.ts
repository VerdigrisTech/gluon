import { NextFunction, Request, Response } from "express";

export default class Controller {
  constructor() {}

  public index(req: Request, res: Response, next: NextFunction) {
    throw new Error("Index method is not implemented");
  }

  public show(req: Request, res: Response, next: NextFunction) {
    throw new Error("Show method is not implemented");
  }

  public create(req: Request, res: Response, next: NextFunction) {
    throw new Error("Create method is not implemented");
  }

  public update(req: Request, res: Response, next: NextFunction) {
    throw new Error("Update method is not implemented");
  }

  public destroy(req: Request, res: Response, next: NextFunction) {
    throw new Error("Destroy method is not implemented");
  }
};
