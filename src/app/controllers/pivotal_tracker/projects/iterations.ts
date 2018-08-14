import { Request, Response } from "express";
import moment from "moment";
import pluralize from "pluralize";
import request from "request-promise-native";

import Controller from "@gluon/controller";
import Config from "@gluon/config";
import { toFixed } from "@gluon/utils/number";
import { sum } from "@gluon/utils/lambda";

export default class IterationsController extends Controller {
  public async index(req: Request, res: Response) {
    const projectId = req.params.projectId;
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}/iterations`;
    const response = await request.get(apiEndpoint, this.requestOptions);
    const iterations = JSON.parse(response);
    const attachments = iterations.map(this.formatIteration.bind(this));

    res.json({ attachments });
  }

  public async show(req: Request, res: Response) {
    const projectId = req.params.projectId;
    const iterationId = req.params.iterationId === "current"
      ? await this.getCurrentIterationId(projectId)
      : parseInt(req.params.iterationId);
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}/iterations/${iterationId}`;
    const response = await request.get(apiEndpoint, this.requestOptions);
    const iteration = JSON.parse(response);
    const attachments = [this.formatIteration.bind(this)(iteration)];

    res.json({ attachments });
  }

  private get baseRequestUrl(): string {
    return Config.get("pivotal-tracker.apiEndpoint");
  }

  private get requestOptions(): any {
    return {
      headers: {
        "X-TrackerToken": Config.get("pivotal-tracker.apiToken")
      }
    };
  }

  private formatStories(stories) {
    const count = stories.length;
    const pts = stories.map(story => story.estimate || 0).reduce(sum, 0);
    return `${count} ${pluralize("stories", count)} (${pts} ${pluralize("points", pts)})`;
  }

  private formatIteration(iteration) {
    const startDate = moment(iteration.start);
    const finishDate = moment(iteration.finish);
    const stories = iteration.stories;
    const acceptedStories = stories.filter(story => {
      return story.current_state === "accepted";
    });
    const rejectedStories = stories.filter(story => {
      return story.current_state === "rejected";
    });
    const deliveredStories = stories.filter(story => {
      return story.current_state === "delivered";
    });
    const finishedStories = stories.filter(story => {
      return story.current_state === "finished";
    });
    const startedStories = stories.filter(story => {
      return story.current_state === "started";
    });
    const remainingStories = stories.filter(story => {
      return story.current_state !== "accepted";
    });

    const completionRate = acceptedStories.length / stories.length;

    return {
      title: `Sprint #${iteration.number}`,
      text: `Week of ${startDate.format("ll")} — ${finishDate.format("ll")}`,
      fields: [
        {
          title: "Team Strength",
          value: `${toFixed(iteration.team_strength * 100.0, 2)}%`,
          short: false
        },
        {
          title: "Stories",
          value: `${remainingStories.length} remaining / ${stories.length} total (${toFixed(completionRate * 100)}% completed)`,
          short: false
        },
        {
          title: "Accepted",
          value: this.formatStories(acceptedStories),
          short: true
        },
        {
          title: "Rejected",
          value: this.formatStories(rejectedStories),
          short: true
        },
        {
          title: "Delivered",
          value: this.formatStories(deliveredStories),
          short: true
        },
        {
          title: "Finished",
          value: this.formatStories(finishedStories),
          short: true
        },
        {
          title: "Started",
          value: this.formatStories(startedStories),
          short: true
        }
      ]
    };
  }

  private async getCurrentIterationId(projectId): Promise<number> {
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}`;
    const response = await request.get(apiEndpoint, this.requestOptions);
    const project = JSON.parse(response);
    return project.current_iteration_number;
  }
}
