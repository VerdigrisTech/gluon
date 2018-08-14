import { Request, Response } from "express";
import request from "request-promise-native";

import Config from "@gluon/config";
import Controller from "@gluon/controller";

export default class ProjectsController extends Controller {
  private get baseRequestUrl(): string {
    return Config.get("pivotal-tracker.apiEndpoint");
  }

  private get requestOptions(): any {
    return {
      headers: {
        "X-TrackerToken": Config.get("pivotal-tracker.apiToken")
      }
    };
  };

  public async index(req: Request, res: Response) {
    const apiEndpoint = `${this.baseRequestUrl}/projects`;
    const response = await request(apiEndpoint, this.requestOptions);
    const projects = JSON.parse(response);
    const attachments = projects.map(project => {
      return {
        title: project.name,
        title_link: `https://www.pivotaltracker.com/n/projects/${project.id}`
      };
    });

    res.json({ attachments });
  }

  public async show(req: Request, res: Response) {
    const projectId = req.params.projectId;
    const apiEndpoint = `${this.baseRequestUrl}/projects/${projectId}`;
    const response = await request.get(apiEndpoint, this.requestOptions);
    const project = JSON.parse(response);
    const attachments = [{
      title: project.name,
      title_link: `https://www.pivotaltracker.com/n/projects/${project.id}`
    }];

    res.json({ attachments });
  }
};
