# Bucky, the Chatbot of Microwork.
Bucky is a chatbot specialized in microwork. He can be found on Telegram: just search for `@buck_a_bot` in the Telegram search bar!

## Installation
Go to the `/src` directory and run `npm install`.

## Deployment
To deploy the crowdsourcing platform, go to the root directory and execute the following steps.

### Step 1
Execute command:

``
docker-compose up
``

(For instructions on how to install docker-compose, click [here](https://docs.docker.com/compose/install/))

### Step 2
Navigate your browser to `localhost:3333/seed/reset-and-seed` to build and fill the database.

## Further documentation
- [Pipelines](docs/pipelines.md)
- [Requester API](docs/pipelines.md)
- [Task design](docs/task-design.md)
