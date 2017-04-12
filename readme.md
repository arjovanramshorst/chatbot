# Bucky, the Chatbot of Microwork.

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

## Instructions for workers
Bucky can be found on Telegram. Just search for `@buck_a_bot` in the Telegram search bar.

## Instructions for requesters
TODO ARJO

## Using the pipelines

In this section we descibre how to run the different pipelines for the different tasks.

### Twitter pipelines

The twitter pipeline is constructed completely independent of the crowdsourcing platform. In order to make use of this pipeline, one should navigate to `task_pipelines/twitter`.

From this directory one should run `npm install` to install required packages based on `package.json`.

#### Preprocessing

To start preprocessing and add the processed tweets to the task, run `node input.js`.

#### Postprocessing

Postprocessing allows the requester to read the responses from the workers in a more readable format (csv) with some additional information computed and added to the csv file based on the different responses.

To start postprocessing run `node output.js` from the `task_pipelines/twitter` directory. The console provdes feedback as to what tweets are added and a csv file (file.csv) is added to the directory containing the results.

### Dropbox pipelines

The twitter pipeline is constructed completely independent of the crowdsourcing platform. In order to make use of this pipeline, one should navigate to `task_pipelines/dropbox`.

From this directory one should run `npm install` to install required packages based on `package.json`.

#### Preprocessing

To start preprocessing and add the processed tweets to the task, run `node input.js`.

#### Postprocessing

Postprocessing allows the requester to read the responses from the workers in a more readable format (csv) with some additional information computed and added to the csv file based on the different responses. This computed values include the majority vote value as well as the certainty value for the different image categories.

To start postprocessing run `node output.js` from the `task_pipelines/dropbox` directory. The console provdes feedback as to what tweets are added and a csv file (file.csv) is added to the directory containing the results.
