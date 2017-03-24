# Chatbots for Microwork.
## Setting up Rasa NLU
`pip install rasa_nlu`
`pip install git+https://github.com/mit-nlp/MITIE.git`

## Opstarten server
`python -m rasa_nlu.server -c config.json --server_model_dir=./Models/model_YYYYMMDD-HHMMS`
`nodemon server.js`