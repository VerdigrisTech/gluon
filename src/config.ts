import _ from "lodash";

export default class Config {
  private config: any;

  public constructor(initialConfig: Object) {
    this.config = initialConfig;
  }

  public get(key: string): any {
    const keyPath: string[] = key.split(".");
    const value = keyPath.reduce((config, key) => {
      return config[key];
    }, this.config);
    return value;
  }

  public set(key: string, value): void {
    this.config[key] = value;
  }

  public toJSON(): any {
    return _.cloneDeep(this.config);
  }
};
