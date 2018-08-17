import { Request, Response } from "express";
import moment, { duration } from "moment";
import pluralize from "pluralize";
import request from "request-promise-native";
import { quantile } from "simple-statistics";

import Controller from "@gluon/controller";
import Config from "@gluon/config";
import { toFixed } from "@gluon/utils/number";
import { sum } from "@gluon/utils/lambda";

const cycleTimeTitle = {
  "total_cycle_time": "total cycle time",
  "started_time": "cycle time in started state",
  "finished_time": "cycle time in finished state",
  "delivered_time": "cycle time in delivered state",
  "rejected_time": "cycle time in rejected state"
};

const storyTypeEmojis = {
  "feature": ":star:",
  "bug": ":beetle:",
  "chore": ":gear:",
  "release": ":checkered_flag:"
};

const pointEstimateEmojis = [
  ":zero:",
  ":one:",
  ":two:",
  ":three:",
  ":four:",
  ":five:",
  ":six:",
  ":seven:",
  ":eight:",
  ":nine:",
  ":keycap_ten:"
];

export default class IterationsController extends Controller {
  public async index(req: Request, res: Response) {
    const projectId = req.params.projectId;
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}/iterations`;
    const iterations = await request.get(apiEndpoint, this.requestOptions);
    const attachments = iterations.map(this.formatIteration.bind(this));

    res.json({ attachments });
  }

  public async show(req: Request, res: Response) {
    const projectId = req.params.projectId;
    const iterationId = req.params.iterationId === "current"
      ? await this.getCurrentIterationId(projectId)
      : parseInt(req.params.iterationId);
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}/iterations/${iterationId}`;
    const iteration = await request.get(apiEndpoint, this.requestOptions);
    const attachments = [this.formatIteration.bind(this)(iteration)];

    res.json({ attachments });
  }

  /**
   * Returns stories that have cycle times in the given percentile.
   */
  public async cycleTimePercentiles(req: Request, res: Response) {
    const format = req.query.format || "slack";
    const projectId = req.params.projectId;
    const iterationId = req.params.iterationId === "current"
      ? await this.getCurrentIterationId(projectId)
      : parseInt(req.params.iterationId);

    const projectUrl = `${this.baseRequestUrl}/projects/${projectId}`;
    const iterationApi = `${projectUrl}/iterations/${iterationId}?fields=:default,stories(:default,cycle_time_details)`;
    const membershipsApi = `${projectUrl}/memberships`;
    const [iteration, memberships] = await Promise.all([
      request.get(iterationApi, this.requestOptions),
      request.get(membershipsApi, this.requestOptions)
    ]);

    const people = memberships.map(membership => membership.person)
      .reduce((people: Map<number, string>, person) => {
        people.set(person.id, person.name);
        return people;
      }, new Map());

    // Default to 95th percentile cycletime.
    const p = parseFloat(req.query.percentile || "0.95");
    const state = req.query.state;
    const cycleTimeState = state ? `${state}_time` : "total_cycle_time";
    const millisAtP = quantile(iteration.stories.map(s => s.cycle_time_details[cycleTimeState]), p);
    const timeAtP = duration(millisAtP).humanize();
    const topStories = iteration.stories.filter(s => s.current_state === state && s.cycle_time_details[cycleTimeState] >= millisAtP)
      .sort((story1, story2) => {
        return story2.cycle_time_details[cycleTimeState] - story1.cycle_time_details[cycleTimeState];
      });

    const fields = topStories.map(s => {
      const titleEmoji = storyTypeEmojis[s.story_type];
      const pointEstimateEmoji = s.story_type === "feature" ? pointEstimateEmojis[s.estimate] : "";
      const description = s.description && s.description !== "" ? s.description : "_No story description_";
      const owners = s.owner_ids.map(id => people.get(id)).join(", ");
      let value = `${description}\n\n:id: *Story ID:* <${s.url}|#${s.id}>\n:stopwatch: *Cycle Time:* ${duration(s.cycle_time_details[cycleTimeState]).humanize()}`;
      value += cycleTimeState === "total_cycle_time" ? `\n:vertical_traffic_light: *State:* ${s.current_state}` : "";
      value += `\n:busts_in_silhouette: *Owners:* ${owners}`;

      return {
        title: `${titleEmoji}${pointEstimateEmoji} ${s.name}`,
        value,
        short: false
      };
    });

    const percentile = toFixed(p * 100);
    let text = `Stories listed below have cycle times above ${timeAtP} (${percentile}ₜₕ percentile) this sprint. If your story is listed here, considering updating the estimate to be higher or break it up into smaller stories.\n`;

    if (fields.length === 0) {
      text += "\n:tada: _Hooray! There are no";
      text += state ? ` ${state}` : "";
      text += ` stories with cycle times above ${percentile}ₜₕ percentile as of today!_`;
    }

    const attachment = {
      title: `${pluralize("Story", topStories.length)} by ${cycleTimeTitle[cycleTimeState]}`,
      title_link: `https://www.pivotaltracker.com/reports/v2/projects/${projectId}/cycle_time`,
      text,
      color: fields.length > 0 ? req.query.color : "good",
      fields
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
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}?fields=current_iteration_number`;
    const project = await request.get(apiEndpoint, this.requestOptions);
    return project.current_iteration_number;
  }
}
