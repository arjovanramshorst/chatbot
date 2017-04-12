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

### Step 2 (optional)
Navigate your browser to `localhost:3333/seed/reset-and-seed` to fill the database with tasks. Use the [pipelines](docs/pipelines.md) to insert task units.

### Step 3
Bucky is now active on port 2222, the [Requester API](docs/requester-api.md) on port 3333 and the MongoDB on port 4444.

## Further documentation
- [Task design](docs/task-design.md)
- [Pipelines](docs/pipelines.md)
- [Requester API](docs/requester-api.md)
