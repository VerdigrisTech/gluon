import { join } from "path";
import {
  camelCase,
  concat,
  dropRight,
  flatten,
  includes,
  isEmpty,
  last,
  pullAll
} from "lodash";
import { singular } from "pluralize";

export class Route {
  protected _path: string;
  protected _verb: string;
  protected _controller: any;
  protected _children: Route[];

  constructor(path: string, verb?: string, controller?: any, routes?: Route[]) {
    this._path = path;
    this._verb = verb;
    this._controller = controller;
    this._children = routes || [];
  }

  public get children() {
    return this._children;
  }

  public get hasChildren() {
    return this._children && this._children.length > 0;
  }

  public list(): Route[] {
    const routes: Route[] = [];

    function dfs(route: Route) {
      routes.push(route);
      if (route.hasChildren) {
        route.children.forEach(dfs);
      }
    }

    dfs(this);

    return routes;
  }

  public get(path: string, controller: any) {
    this.mount(path, "GET", controller);
  }

  public mount(path: string, verb: string, controller: any) {
    const subPath = join(this.path, path);
    const childRoute = new Route(subPath, verb, controller);
    this._children.push(childRoute);
  }

  public namespace(namespace, next: (r: Route) => void) {
    const subPath = join(this.path, namespace);
    const namespacedRoute = new Route(subPath);
    this._children.push(namespacedRoute);
    next(namespacedRoute);
  }

  private verbsByControllerMethod(methodName: string): string[] {
    for (let [methods, verbs] of new Map([
      [["index", "show"], ["GET"]],
      [["create"], ["POST"]],
      [["update"], ["PATCH", "PUT"]],
      [["destroy"], ["DELETE"]]
    ])) {
      if (includes(methods, methodName)) {
        return verbs;
      }
    }

    return [];
  }

  public resources(name: string, option: any, next?: (r: Route) => void): void {
    const subPath = join(this.path, name);
    const defaults = {
      only: ["index", "show", "create", "update", "destroy"]
    };
    const resourceOption: {
      excludes: string[],
      only: string[]
    } = typeof option === "object" ? option : defaults;

    const { only, excludes } = resourceOption;
    const nameByWord = name.split(/[\-_]/);
    const lastWordSingular = singular(last(nameByWord));
    const singularName = camelCase(concat(dropRight(nameByWord), lastWordSingular).join("_"));
    const resourceIdName = `${singularName}Id`;
    const identifiableSubPath = `${subPath}/:${resourceIdName}`;

    if (Array.isArray(excludes) && !isEmpty(resourceOption.excludes)) {
      pullAll(only, excludes);
    }

    const resourceRoutes = flatten(only.map(controllerMethod => {
      const identifiable = !includes(["index", "create"], controllerMethod);
      const routePath = identifiable ? identifiableSubPath : subPath;
      const verbs = this.verbsByControllerMethod(controllerMethod);
      return verbs.map(verb => new Route(routePath, verb, `${name}.${controllerMethod}`));
    }));

    resourceRoutes.forEach(route => this._children.push(route));

    const baseResourceRoute = new Route(identifiableSubPath);
    this._children.unshift(baseResourceRoute);

    const cb: (r: Route) => void = typeof option === "function" ? option : next;
    cb(baseResourceRoute);
  }

  public get path(): string {
    return this._path;
  }

  public get verb(): string {
    return this._verb;
  }

  public get controller(): any {
    return this._controller;
  }
};
