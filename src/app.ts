import EventEmitter from "events";
import express, { Express, RequestHandler } from "express";
import { last } from "lodash";
import path from "path";

import routes from "./app/routes";
import Config from "@gluon/config";
import Controller from "@gluon/controller";
import { Route } from "@gluon/router";
import importTree from "@gluon/utils/import-tree";

export default class App extends EventEmitter {
  protected app: Express;
  protected server: any;
  protected controllers: Map<string, Controller>;
  protected controllerPath: string = path.join(__dirname, "app", "controllers");

  constructor() {
    super();
    this.app = express();
    this.initialize();
  }

  private async initialize() {
    await this.loadControllers();
    this.loadRoutes();
  }

  private async loadControllers() {
    const controllerClasses = await importTree(this.controllerPath);
    this.controllers = new Map();
    controllerClasses.reduce((controllers: Map<string, Controller>, controller: { path: string, module: any }) => {
      const ControllerClass = controller.module.default;
      const controllerDir = path.dirname(controller.path);
      const controllerName = path.parse(controller.path).name;
      const controllerPath = path.join(controllerDir, controllerName);
      const relativePath = path.relative(this.controllerPath, controllerPath);
      controllers.set(path.join("/", relativePath), new ControllerClass());
      return controllers;
    }, this.controllers);
  }

  private loadRoutes() {
    const rootRoute = new Route("/", "GET");
    routes(rootRoute);
    const allRoutes = rootRoute.list().filter(route => route.controller);
    allRoutes.forEach(route => {
      const routeMethod: (path: string, ...callback: RequestHandler[]) => Express = this.app[route.verb.toLowerCase()].bind(this.app);
      // Resolve controller methods
      if (typeof route.controller === "function") {
        routeMethod(route.path, route.controller);
      } else if (typeof route.controller === "string") {
        const methodName = last(route.controller.split("."));
        const controller = this.controller(route.path);
        const controllerMethod = controller[methodName];
        routeMethod(route.path, controllerMethod.bind(controller));
      }
    });
  }

  public address() {
    return this.server.address();
  }

  public listen(port?: number, listenAddr?: string): void {
    const _port = port || Config.get("server.port");
    const _listenAddr = listenAddr || Config.get("server.listenAddr");
    this.server = this.app.listen(_port, _listenAddr);
    this.server.on("listening", () => this.emit("listening"))
  }

  public controller(routePath: string): Controller {
    const key = routePath.replace(/\/:[\w\-]+/g, "");
    return this.controllers.get(key);
  }
};
