"use strict";

const Crisp = require('node-crisp-api/lib/crisp');

const pluginUrn = "urn:my.account:pluginname:0";
const crispAPIIdentifier = "change-me-please";
const crispAPIKey = "abcdefghijklmnopqrstuvwxyz";

class PongPlugin {
  constructor() {
    this.crispClient = new Crisp();
    this.websites = new Map();

    this._pluginId = "";
    this._apiKey = crispAPIKey;
    this._apiIdentifier = crispAPIIdentifier;

    this._initPlugin();
  }

  updateMessageForWebsite(websiteId, message) {
    this.crispClient.pluginSubscriptions.updateSubscriptionSettings(
      websiteId,
      this._pluginId,
      {message: message})
      .then(() => {
        this.websites[websiteId] = {message: message};
        console.log('Successfully updated plugin config for website ID:', websiteId);
      })
      .catch(reason => console.error(reason));
  }

  _initPlugin() {
    this.crispClient.setTier('plugin');
    this.crispClient.authenticate(this._apiIdentifier, this._apiKey);

    // Retrieve plugin ID for later use.
    this.crispClient.pluginConnect.connectAccount()
      .then(resp => {
        this._pluginId = resp.plugin_id;
        console.log('Retrived plugin ID successfully: pluginId=' + this._pluginId);
      })
      .catch(reason => console.error(reason));

    // Retrieve all websites connected to this plugin.
    this.crispClient.pluginConnect.listAllConnectWebsites(1, true)
      .then(websites => {
        let nbWebsites = 0;
        for (const website of websites) {
          this.websites[website.website_id] = website.settings;
          nbWebsites++;
        }
        if (nbWebsites === 0) {
          console.error('No connected website retrieved. ' +
            'Please add a trusted website in your Pong_plugin Marketplace settings.')
        } else {
          console.log(`Retrieved ${nbWebsites} connected websites!`);
          console.log('Websites configurations:');
          console.log(this.websites);
        }

        this._events();
      })
      .catch(reason => console.error(reason));

  }

  _events() {
    const self = this;

    this.crispClient.on("message:received", function(event) {
      console.log("Got 'message:received' event:", event);

      if (event.origin === pluginUrn) {
        console.log("This message comes from me... Skipping");
        return;
      }

      self.crispClient.websiteConversations.sendMessage(
        event.website_id,
        event.session_id,
        {
          type: 'text',
          from: 'operator',
          origin: pluginUrn,
          content: self.websites[event.website_id].message,
          user: {
            nickname: 'Ping-pong',
            avatar: 'https://crisp.chat/favicon-512x512.png',
          }})
        .then(resp => console.log(resp))
        .catch(reason => console.log(reason));
    });

    this.crispClient.on("message:send", function(event) {
      console.log("Got 'message:send' event:", event);
    });

    console.log("Now listening for events.");
  }
}

module.exports = PongPlugin;