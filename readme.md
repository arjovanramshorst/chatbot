# Chatbots for Microwork.
## Setting up Rasa NLU
`pip install rasa_nlu` <br />
`pip install git+https://github.com/mit-nlp/MITIE.git`

## Opstarten server
`python -m rasa_nlu.server -c config.json --server_model_dir=./Models/model_YYYYMMDD-HHMMS` <br />
`nodemon server.js` or run `start_worker.sh`