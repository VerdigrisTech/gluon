import EventEmitter from "events";
import express from "express";
import routes from "./app/routes";
import Config from "./config";

export default class App extends EventEmitter {
  protected app: any;
  protected config: Config;
  protected server: any;

  constructor(config: Config) {
    super();
    this.config = config;
    this.app = express();
    this.loadControllers();
    this.loadRoutes();
  }

  private loadControllers() {
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
