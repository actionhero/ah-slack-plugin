const {api, Server} = require('actionhero')
const {RtmClient, CLIENT_EVENTS, RTM_EVENTS} = require('@slack/client')

module.exports = class Slack extends Server {
  constructor () {
    super()
    this.type = 'slack'

    this.attributes = {
      canChat: true,
      logConnections: true,
      logExits: true,
      sendWelcomeMessage: false,
      verbs: [
        'roomAdd',
        'roomLeave',
        'roomView',
        'detailsView',
        'say'
      ]
    }

    this.messages = []
    this.originalParams = {}
  }

  async initialize () {
    this.on('connection', (connection) => {
      this.connection = connection
      if (this.config.republishRoom) { api.chatRoom.addMember(connection.id, this.config.republishRoom) }
    })

    this.on('actionComplete', async (data) => {
      let responseString
      if (data.toRender === false) { return }

      if (typeof data.response === 'string') {
        responseString = data.response
      } else if (data.response.error) {
        responseString = data.response.error.toString()
      } else if (data.response.message) {
        responseString = data.response.message.toString()
      } else if (data.response.text) {
        responseString = data.response.text.toString()
      } else {
        responseString = ''
        Object.keys(data.response).forEach((key) => {
          let child = data.response[key]
          if (typeof child !== 'string' && typeof child !== 'number') {
            child = JSON.stringify(data.response[key])
          }
          responseString += `*${key}*: ${child}\r\n`
        })
      }

      const channel = this.originalParams[this.connection.messageCount].channel
      await this.sendMessage(responseString, channel)
      delete this.originalParams[this.connection.messageCount]
    })
  }

  storeMessage (message) {
    this.messages.push(message)
    while (this.messages.length > this.config.messagesToSave) { this.shift() }
  }

  async handleMessage (message) {
    if (!message.text) { return }
    this.storeMessage(message)
    this.connection.params = message

    let matched = false
    this.config.messageActionRegexp.forEach((regexp) => {
      const matches = message.text.match(regexp)
      if (matches && matched === false) {
        this.connection.messageCount++
        this.connection.params.action = matches[1]
        this.originalParams[this.connection.messageCount] = this.connection.params
        matched = true
        this.processAction(this.connection)
      }
    })
  }

  async start () {
    await new Promise((resolve) => {
      const clientOptions = {
        logger: (level, message) => { this.log(message, level) }
      }

      this.client = new RtmClient(this.config.token, clientOptions)

      this.client.on(CLIENT_EVENTS.RTM.WS_ERROR, (error) => { throw error })
      this.client.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, (error) => { throw error })

      this.client.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
        this.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}`)
      })

      this.client.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
        resolve()
      })

      this.client.on(RTM_EVENTS.MESSAGE, async (message) => {
        await this.handleMessage(message)
      })

      this.client.start()
    })

    this.buildConnection({
      rawConnection: this.client,
      remoteAddress: 'slack',
      remotePort: 'slack'
    })
  }

  stop () {
    try {
      this.client.disconnect()
    } catch (error) {
      this.log(error, 'warning')
    }
  }

  async sendMessage (message, slackChannel) {
    await new Promise((resolve, reject) => {
      this.client.sendMessage(message, slackChannel, (error) => {
        if (error) { return reject(error) }
        resolve()
      })
    })
  }

  sendFile (connection, error, fileStream, mime, length, lastModified) {
    throw new Error('sending files not yet supported; a web API token will be needed')
  }

  goodbye (connection) { }
}
