# bespin

Welcome to Cloud City!

## Dependencies

For the [Quickstart](https://github.com/rothfels/bespin#Quickstart), you will need:

- [Node.js 12.x](https://nodejs.org/en/download/)
- [Docker](https://docs.docker.com/get-docker/)
- [Visual Studio Code](https://code.visualstudio.com/download)

Later, to deploy your app you will also need:

- [terraform ^0.12](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- [AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [`jq`](https://stedolan.github.io/jq/download/)
- (Windows only) [`zip`](http://gnuwin32.sourceforge.net/packages/zip.htm)

### nvm

If you've already installed Node but aren't running Node.js 12.x (`node --version`), use `nvm` to install an appropriate version. [Follow their instructions.](https://github.com/nvm-sh/nvm)

```
nvm install 12
nvm alias default 12
```

## Quickstart

First, install [the Quickstart dependencies](https://github.com/rothfels/bespin#Dependencies).

### Choose your team slug

Choose a short, alphanumeric [*slug*](https://en.wikipedia.org/wiki/Clean_URL#Slug) for your project. This will be used to identify all the AWS resources created for your project, as well as the public URL for your project. Once you finish the Quickstart, your app will be available at https://**yourteamslug**.cloudcity.computer. **Your slug should be only letters and digits.**

### Get the starter project

Clone and initialize the starter project. You'll need to have `node` and `npm` installed first. See [dependencies](https://github.com/rothfels/bespin#dependencies).

```
source <(curl -s https://cs188.cloudcity.computer/app/script/init-project.sh)
```

This will create a directory with the name of your project slug and install the project dependencies. Open the project directory in VS Code. Install the recommended extensions then reload VS Code.

### Run a local development server

#### Start MySQL & Redis

Your appserver can use a MySQL database and a Redis instance. Start these on your local machine in the background:

```
docker-compose up -d
```

#### Compile ts

You must compile TypeScript before it is runnable in a browser. Start a "watch" mode process that compiles your TypeScript as soon as you change it.

```
npm run watch
```

#### Run `server.ts`

Open the `Run/Debug` tab in VS Code and choose the `server.ts` run configuration, then hit play.

![image](https://user-images.githubusercontent.com/1095573/93257426-acb24f80-f751-11ea-8df2-7768ecab3aa5.png)

Open http://localhost:3000 to see your app.

Open http://localhost:3000/graphql to see your interactive GraphQL API explorer.

Open `Debug Console` in VS Code to see console output.

![image](https://user-images.githubusercontent.com/1095573/93257501-cc497800-f751-11ea-9dc3-c12beee3c56f.png)

Set breakpoints in the gutter to the left of your code. **Note: these only work on code executing on the server, not in the browser.**

![image](https://user-images.githubusercontent.com/1095573/93257545-dcf9ee00-f751-11ea-9a7a-1f103a3d3c5a.png)

## Project Structure & HOWTOs

- `web`: runs code in the browser (React application). In production, this code is "bundled" into a single `bundle.js` file and served by te backend. It is sourced by the HTML served at `/app`.
- `server`: runs code on Node.js (Express server, GraphQL API). In production, this code may run in ECS or on AWS Lambda, depending on how you deploy it. Serves:
  - `/app`: React (client & server rendered) application, static assets
  - `/graphql`: GraphQL API
  - `/graphqlsubscription`: GraphQL API for subscriptions (over websocket)
  - `/api/:function`: non-graphql/REST APIs (e.g. RPCs)
- `common`: code that may be imported by either `web` or `server` projects. Must be runnable in both server and browser contexts.
- `public`: static assets bundled with the server and served at `/app`. Destination directory for build assets (e.g. `bundle.js`).

### Database models & migrations

The project ships with an ORM and a migration manager. You may use the ORM or write raw SQL statements or both.

Define your ORM models in `server/src/db/models`. Tables will automatically get created. See [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript#readme) for details.

Define migrations in `server/src/db/migrations`. They will automatically get run before your server starts. The starter project ships with an initial migration. Add new migrations by checking in additional migration files using the naming convention `VX.X__Description.sql`. The server only runs migrations which haven't already been run successfully. The server will fail before accepting connections if any migrations fail. You must manually correct the failed migrations to get the server into a healthy state.

TODO(rothfels): add DB troubleshooting docs


## Deploy your app to AWS

### Create a Honeycomb account

[Create a free Honeycomb account](https://ui.honeycomb.io/signup?utm_source=product-trial-page&utm_medium=get-started-cta-self&utm_campaign=trial). Save your API key.

### Set AWS environment variables

The `terraform` commands to set up your AWS infrastucture require credentials. Your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` will be provided during the first lab session. Set these values on your environment (e.g. in `.bashrc` or `.zshrc`) or [follow the instructions for managing AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html).

```
export AWS_ACCESS_KEY_ID=<insert your key>
export AWS_SECRET_ACCESS_KEY=<insert your key>
export AWS_REGION=us-west-2
```

### Run terraform

Your terraform configuration is in `terraform/main.tf`. The default configuration includes:

- a MySQL database
- a Redis instance
- an appserver to run your Node.js server code
- an API Gateway routing traffic through a load balancer to your appserver

Open `terraform/main.tf` and **set your Honeycomb API key** (look for `<insert key here>`), then deploy your terraform resources:

```
cd terraform
terraform init
terraform apply
```

The `terraform apply` step will run code to create all the resources required to run your application. It will generate a `terraform.tfstate` file which it uses to track and manage the resources it has created. **Don't lose this file, and make sure to check it into your repo with git**.

#### De-provisioning resource

When you're done with a resource, simply delete or comment out the code and re-run `terraform apply`. :)

### Deploy your code

After provisioning your `terraform` resources run:

```
npm run deploy:init
```

This will package your server code and deploy it to your appserver. After a minute, go to https://**yourteamslug**.cloudcity.computer to see your app.

## Server scaling

Initially, your server will be deployed **as a single ECS task** running with minimally provisioned CPU and memory.

Over the quarter, you will be able to:

- horizontally scale appserver tasks (set desired run count)
- vertically scale appserver tasks (set desired CPU/memory)
- decompose services
  - via additional appservers running on ECS
  - via AWS lambda function(s)

### websockets

You may add websockets to your app to allow publishing data from your server to clients. Add this to your `main.tf`:

```
module "websocket_api" {
  source         = "./modules/websocket_api"
  appserver_host = module.webserver.host
}
```

Provision it with `terraform apply`. Then, tell your appserver how to communicate with your websocket API by setting the `ws_url` variable on your appserver:

```
  # uncomment to add graphql subscriptions, must make a websocket api first
  # ws_url = module.websocket_api.url
```

#### Troubleshooting: manual deployment trigger

Unfortunately `terraform` can't currently trigger deployments of websocket APIs. You must manually login to the AWS console to trigger a deployment of your websocket API.

![image](https://user-images.githubusercontent.com/1095573/93257685-13d00400-f752-11ea-93e0-881c3c83a09a.png)

### lambda

You may use lambda to decompose services from your appserver. You will also need to provision a lambda to run distributed load tests. Add this to your `main.tf`:

```
module "lambda" {
  source = "./modules/lambda"

  honeycomb_key = <insert your key>

  mysql_host = module.mysql.host
  redis_host = module.redis.host
}
```

Then provision it with `terraform apply`. You should also modify your `deploy-local.sh` and uncomment the section which deploys code to your newly provisioned lambda.

## Load testing

The project includes a load test runner which you may run from the `scratchpad.ts` launch configuration:

![image](https://user-images.githubusercontent.com/1095573/93257625-fd29ad00-f751-11ea-839b-ac4f16ab602b.png)

A load test is a sequence of `ArrivalPhase`s, each consisting of period of time when some # of users/second run a `UserScript`. A user script is a TypeScript function you write which simulates real user behavior.

The default script in `loadtest.ts` makes 3 GET requests to your appserver. Because your app is server rendered, your server will make GraphQL requests to itself to fetch the data necessary to render your app.

You may modify the script in `loadtest.ts` to:

- make arbitrary GET or POST (e.g. GraphQL) requests to any endpoint of your server, using the `fetch` interface or `apolloClient`
- (WIP) trigger a lambda invocation which loads your app in a headless Chrome instance

### Local execution vs. distributed execution

Your local computer can only put so much load on your server because there are limitations to how many TCP connections Node.js will concurrently let you make.

You may execute your user scripts locally or using a distributed exeucutor (AWS lambda). By default, the loadtest is set up for local execution.

### Viewing results

Your Honeycomb instrumentation will provide all the data visualizations you need. Login to Honeycomb to view your server metrics.

![image](https://user-images.githubusercontent.com/1095573/93257787-3d892b00-f752-11ea-8219-e1789b42cbf0.png)
