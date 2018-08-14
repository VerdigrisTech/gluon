import { readdir } from "fs-extra";
import _ from "lodash";
import { join, parse } from "path";

export default class Config {
  private static config: any;

  public constructor(initialConfig: Object) {
    Config.config = initialConfig;
  }

  public static async load(): Promise<Config> {
    const configPath = join(__dirname, "..", "config");
    const configFiles = await readdir(configPath);

    const allConfig = await configFiles.map(file => {
        return {
          absoluteFile: join(configPath, file),
          fileName: file,
          key: parse(file).name
        };
      })
      .reduce((mergedConfig, configFile) => {
        console.error(`Loading ${configFile.key} configuration...`);
        const config = {};
        config[configFile.key] = require(configFile.absoluteFile);
        return Object.assign(mergedConfig, config);
      }, {});

    return new Config(allConfig);
  }

  public static get(key: string): any {
    const keyPath: string[] = key.split(".");
    const value = keyPath.reduce((config, key) => {
      return config[key];
    }, Config.config);
    return value;
  }

  public static set(key: string, value): void {
    Config.config[key] = value;
  }

  public static toJSON(): any {
    return _.cloneDeep(Config.config);
  }
};
