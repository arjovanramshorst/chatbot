# Using the pipelines

In this section we describe how to run the different pipelines for the different tasks. Please note that all tasks assume that certain users have created the three standard tasks which are seeded (after first running `docker-compose up`) by navigating your browser to localhost:3333/seed/reset-and-seed to fill the database with these tasks.

## Twitter pipelines

The twitter pipeline is constructed completely independent of the crowdsourcing platform. In order to make use of this pipeline, one should navigate to `task_pipelines/twitter`.

From this directory one should run `npm install` to install required packages based on `package.json`.

### Preprocessing

To start preprocessing and add the processed tweets to the task, run `node input.js`.

### Postprocessing

Postprocessing allows the requester to read the responses from the workers in a more readable format (csv) with some additional information computed and added to the csv file based on the different responses.

To start postprocessing run `node output.js` from the `task_pipelines/twitter` directory. The console provides feedback as to what tweets are added and a csv file (file###########.csv, where # is a number) is added to the directory containing the results.

## Dropbox pipelines

The twitter pipeline is constructed completely independent of the crowdsourcing platform. In order to make use of this pipeline, one should navigate to `task_pipelines/dropbox`.

From this directory one should run `npm install` to install required packages based on `package.json`.

### Preprocessing

To start preprocessing and add the processed tweets to the task, run `node input.js`.

### Postprocessing

Postprocessing allows the requester to read the responses from the workers in a more readable format (csv) with some additional information computed and added to the csv file based on the different responses. This computed values include the majority vote value as well as the certainty value for the different image categories.

To start postprocessing run `node output.js` from the `task_pipelines/dropbox` directory. The console provides feedback as to what tweets are added and a csv file (file###########.csv, where # is a number) is added to the directory containing the results.
