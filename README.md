# ![gluon](https://s3-us-west-2.amazonaws.com/verdigris/gluon-horizontal.svg)

Web server for gluing different webhooks together.

## Getting started

The easiest way to get started is by running a Docker image:

```console
$ docker run --rm -e "PIVOTAL_TRACKER_API_TOKEN=<TOKEN>" -p 8888:8888 -it verdigristech/gluon:latest
╭──────┬──┐  ┌──┐┌──┬──────┬──────╮
│  ╭───┤  │  │  ││  │  ╭╮  │  ┌╮  │
│  │┌──┤  │  │  ││  │  ││  │  ││  │
│  ╰╯  │  └──┤  ╰╯  │  ╰╯  │  ││  │
╰──────┴─────┴──────┴──────┴──┘└──┘

Version 1.2.8
Booting gluon master (PID: 8991)...
8 core(s) detected
Listening at http://0.0.0.0:8888
Booting gluon worker 0 (PID: 8992)
Booting gluon worker 1 (PID: 8993)
Booting gluon worker 2 (PID: 8994)
Booting gluon worker 3 (PID: 8995)
Booting gluon worker 4 (PID: 8996)
Booting gluon worker 5 (PID: 8997)
Booting gluon worker 6 (PID: 8998)
Booting gluon worker 7 (PID: 8999)
```

To obtain your Pivotal Tracker API token, refer to
[Pivotal Tracker documentation](https://www.pivotaltracker.com/help/articles/api_token/).

## Usage

The endpoints you can query are:

- `/projects`

  Retrieves all projects you have access to.

- `/projects/:projectId`

  Retrieves given project by ID.

- `/projects/:projectId/iterations`

  Retrieves all iterations for the given project.

- `/projects/:projectId/iterations/:iterationId`

  Retrieves an iteration by iteration number. You can also specify `current` in
  place of the iteration number to retrieve details about current iteration.

- `/projects/:projectId/iterations/:iterationId/analytics`

  Returns analytics summary of median cycle time, bugs, and rejection rate for
  the given iteration.

- `/projects/:projectId/iterations/:iterationId/cycle_time_percentiles`

  Returns all stories that have the cycle times above given percentiles. The
  cycle time percentiles default to 95th percentile. To change this, specify
  the `percentile` query string and change it to any value between `0.00` and
  `1.00`.

## Deploying for your team

You can run gluon anywhere that supports running a Docker container.

### Heroku

First, you will need Heroku CLI installed on your machine. Then create an app
on Heroku. The example below assumes you've created an app named
`my-heroku-app-name`. You will also need to obtain a
[Heroku API key](https://devcenter.heroku.com/articles/platform-api-quickstart).

```console
$ docker pull verdigristech/gluon:latest
latest: Pulling from verdigristech/gluon
30ab12daea20: Pull complete
Digest: sha256:6f1b1e3cdf0d2788a1ec8248f168bb69d6d7b3c501e1ac69d8b1a0e175cbb5d9
Status: Downloaded newer image for verdigristech/gluon:latest
$ docker tag verdigristech/gluon:latest registry.heroku.com/my-heroku-app-name/web
$ docker login --username=_ --password=$HEROKU_API_KEY registry.heroku.com
$ docker push registry.heroku.com/my-heroku-app-name/web
The push refers to repository [registry.heroku.com/my-heroku-app-name/web]
30ab12daea20: Pushed
183130269443: Layer already exists
2c1c606742bc: Layer already exists
8dfad2055603: Layer already exists
$ heroku container:release --app my-heroku-app-name
```

---

© 2018 Verdigris Technologies Inc. All rights reserved.
