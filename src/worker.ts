import chalk from "chalk";
import http from "http";
import App from "./app";
import Config from "./config";

const process = require("process");

class WebWorker {
  private app: App;
  private workerId: number;
  private config: Config;
  private server: http.Server;

  public async boot(workerId: number, config: Config) {
    this.workerId = workerId;
    this.config = config;

    this.app = new App(this.config);
    this.app.listen();
    this.app.on("listening", () => {
      process.send({
        type: "event",
        lifecycle: "listening",
        data: {
          workerId: this.workerId,
          listen: this.app.address()
        }
      });

      console.error(`Booting gluon worker ${workerId} (PID: ${chalk.red(process.pid)})`);
    });
  }
}

export default WebWorker;
