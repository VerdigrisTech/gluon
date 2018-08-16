import { Request, Response } from "express";
import { duration } from "moment";
import pluralize from "pluralize";
import request from "request-promise-native";

import Controller from "@gluon/controller";
import Config from "@gluon/config";
import { toFixed } from "@gluon/utils/number";

export default class AnalyticsController extends Controller {
  public async index(req: Request, res: Response) {
    const format = req.query.format || "slack";
    const projectId = req.params.projectId;
    const iterationId = req.params.iterationId === "current"
      ? await this.getCurrentIterationId(projectId)
      : parseInt(req.params.iterationid);
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}/iterations/${iterationId}/analytics`;
    const analytics = await request.get(apiEndpoint, this.requestOptions);
    const attachment = {
      title: "Analytics",
      title_link: `https://www.pivotaltracker.com/reports/v2/projects/${projectId}/overview`,
      fields: [
        {
          title: ":stopwatch: Median Cycle Time",
          value: duration(analytics.cycle_time).humanize(),
          short: true
        },
        {
          title: ":beetle: New Bugs Reported",
          value: `${analytics.bugs_created} ${pluralize("bug", analytics.bugs_created)}`,
          short: true
        },
        {
          title: ":no_entry_sign: Story Rejection Rate",
          value: `${toFixed(analytics.rejection_rate)}%`,
          short: true
        }
      ]
    };

    if (format === "standuply") {
      res.json(attachment);
    } else {
      res.json({ attachments: [attachment] });
    }
  }

  private get baseRequestUrl(): string {
    return Config.get("pivotal-tracker.apiEndpoint");
  }

  private get requestOptions(): any {
    return {
      headers: {
        "X-TrackerToken": Config.get("pivotal-tracker.apiToken")
      },
      json: true
    };
  }

  private async getCurrentIterationId(projectId): Promise<number> {
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}?fields=current_iteration_number`;
    const project = await request.get(apiEndpoint, this.requestOptions);
    return project.current_iteration_number;
  }
}
