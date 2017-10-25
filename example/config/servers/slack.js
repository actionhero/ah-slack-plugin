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
        messagesToSave: 100,
        // should we republish all slack messages we receive to an actionhero chat room? (set to null to ignore)
        republishRoom: `slack`
      }
    }
  }
}
