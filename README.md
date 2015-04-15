# Paybot

This is a slack bot that connects to your team. 
It creates a virtual account for each member and lets you pay each other.

# How to run the bot and connect to Slack
## Run
- Clone the repo
- heroku create
- git push heroku master

## Connect to Slack
In the "Integrations" settings of Slack : 
- Add a Outcoming webhook connected to your heroku app http://myapp.herokuapp.com
- Add a Slash command the same way

## Configure Slack tokens in Heroku
- heroku config set:SLACK_TOKEN=your_slack_webhook_token
- heroku config set:SLACK_TOKEN_COMMAND=your_slack_command_token

# How to use the bot

- bangs hi

 - If new user : "Welcome"

 - Else "Already registered"

- bangs 100 @bertran

 - If bertran did not say "bangs hi" (= not registered) : " Receiver did not said hi "

 - If not enough funds : " you have 10, not enought to send 100"

 - Else : "100 bangs sent to bertran"

- /bangs mybangs

 - your balance

- /bangs all

 - List all users with their balances
