require("module-alias/register");
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import Config from "./config";
import WebWorker from "./worker";
import chalk from "chalk";
import { once } from "./run";

const cluster = require("cluster");
const process = require("process");
const packageJson = require('../package.json');

const cpus = os.cpus().length;
const webConcurrency = parseInt(process.env.WEB_CONCURRENCY);
const processes = isNaN(webConcurrency) ? cpus : Math.min(webConcurrency, cpus);
const workers = [];

if (cluster.isMaster) {
  bootMaster();
} else {
  bootWorker();
}

async function bootMaster() {
  printHeader();

  console.error(`Booting gluon master (PID: ${process.pid})...`);
  console.error(`${cpus} core(s) detected`);

  await loadConfig();

  for (let i = 0; i < processes; i++) {
    const worker = cluster.fork();
    workers.push(worker);
    worker.on("message", message => {
      switch (message.type) {
        case "event":
          if (message.lifecycle === "listening") {
            const { data: { listen: { address, port } } } = message;
            printServerInfo(address, port);
          }
      }
    });

    worker.send({
      type: "event",
      lifecycle: "boot",
      data: {
        workerId: i,
        config: Config.toJSON()
      }
    });
  }
}

function bootWorker() {
  const webWorker = new WebWorker();

  process.on('message', message => {
    switch (message.type) {
      case "event":
        if (message.lifecycle === "boot") {
          webWorker.boot(message.data.workerId, new Config(message.data.config));
        }
        break;
      default:
        console.error(`Unknown message type received: ${message.type}`);
    }
  });
}

function printHeader() {
  printLogo();
  printVersion();
}

function printLogo() {
  const logo = [
    "╔═══════════════════════════════════════════╗",
    "║            ╭─╮                            ║",
    "║            │ │                            ║",
    "║    ╭──────╮│ │╭─╮  ╭─╮╭──────╮╭──────╮    ║",
    "║    │ ╭──╮ ││ ││ │  │ ││ ╭──╮ ││ ╭──╮ │    ║",
    "║    │ ╰──╯ ││ ││ ╰──╯ ││ ╰──╯ ││ │  │ │    ║",
    "║    ╰────╮ │╰─╯╰──────╯╰──────╯╰─╯  ╰─╯    ║",
    "║    ╭────╯ │  by Verdigris Technologies    ║",
    "║    ╰──────╯                               ║",
    "╚═══════════════════════════════════════════╝",
    ""
  ].join("\n");

  console.error(chalk.bold(chalk.whiteBright(logo)));
}

function printVersion() {
  console.error(`Version ${packageJson.version}`);
}

const printServerInfo = once(function (address, port) {
  console.error(`Listening at http://${address}:${port}`);
}, this);

async function loadConfig() {
  await Config.load();
}
