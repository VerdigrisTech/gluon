import EventEmitter from "events";
import express from "express";
import fs from "fs-extra";
import path from "path";

import routes from "./app/routes";
import Config from "./config";
import Controller from "./controller";

export default class App extends EventEmitter {
  protected app: any;
  protected config: Config;
  protected server: any;
  protected controllers: Map<string, Controller>;

  constructor(config: Config) {
    super();
    this.config = config;
    this.app = express();
    this.loadControllers();
    this.loadRoutes();
  }

  private async loadControllers() {
    const controllerPath = path.join(__dirname, "app", "controllers");
    const controllerFiles = await fs.readdir(controllerPath);

    this.controllers = new Map();

    const allControllers = await Promise.all(controllerFiles.filter(file => path.parse(file).ext !== ".map")
      .map(async file => {
        return {
          name: path.parse(file).name,
          cls: await import(path.join(controllerPath, file))
        };
      }));

    allControllers.reduce((controllers, controller) => {
      controllers.set(controller.name, controller.cls);
      return controllers;
    }, this.controllers);
  }

  private loadRoutes() {
  }

  public address() {
    return this.server.address();
  }

  public listen(port?: number, listenAddr?: string): void {
    const _port = port || this.config.get("server.port");
    const _listenAddr = listenAddr || this.config.get("server.listenAddr");
    this.server = this.app.listen(_port, _listenAddr);
    this.server.on("listening", () => this.emit("listening"))
  }
};
