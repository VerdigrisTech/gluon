import chalk from "chalk";
import App from "@gluon/app";
import Config from "@gluon/config";

const process = require("process");

class WebWorker {
  private app: App;
  private workerId: number;
  private config: Config;

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
