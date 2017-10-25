# ActionHero Slack Plugin
A Slack server for ActionHero v18+.
It will listen to all messages in all the rooms it is a member of, and do stuff.

Does you action have a response?  It will be send back to slack.
Don't want to respond in Slack?  Set `data.toRender = false` in your action's `run` method.

## Configuration
Make a new bot for your slack team: https://my.slack.com/apps -> manage -> custom integrations -> bots -> new
Note the TOKEN

```js
// config/plugins.js
const path = require('path')

exports['default'] = {
  plugins: (api) => {
    return {
      'slack': {path: path.join(__dirname, '..', 'node_modules', 'ah-slack-plugin')}
    }
  }
}
```

```js
// config/servers/slack.js
exports['default'] = {
  servers: {
    slack: (api) => {
      return {
        enabled: true,
        token: process.env.SLACK_BOT_TOKEN,
        // which messages should we try to parse as actions?  (could be a /command, @ a user, etc)
        // be sure to have a capture, as what you capture will be the action's name we try
        // for example `/^action\s(\w*).*$/i` would match `action thing otherThing`, trying the action "thing"
        messageActionRegexp: /^action\s(\w*).*$/i,
        // how many messages should we store a history of receiving
        // messages can be accessed in `api.servers.servers.slack.messages`
        messagesToSave: 100
      }
    }
  }
}

```
