import chalk from "chalk";
import App from "@gluon/app";

const process = require("process");

class WebWorker {
  private app: App;
  private workerId: number;

  public async boot(workerId: number) {
    this.workerId = workerId;
    this.app = new App();
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
