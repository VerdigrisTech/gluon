import { Route } from "../router";

export default (route: Route) => {
  route.namespace("pivotal_tracker", route => {
    route.resources("projects", { only: ["index", "show"] }, route => {
      route.resources("iterations", { only: ["index", "show"] }, route => {
        route.get("analytics", "analytics.index");
      });
    });
  });
};
