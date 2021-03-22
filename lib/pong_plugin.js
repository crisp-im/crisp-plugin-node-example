"use strict";

const Crisp = require("node-crisp-api");

class PongPlugin {
  constructor(pluginUrn, crispAPIIdentifier, crispAPIKey) {
    this.crispClient = new Crisp();
    this.websites = new Map();

    this._pluginUrn = pluginUrn;
    this._apiIdentifier = crispAPIIdentifier;
    this._apiKey = crispAPIKey;

    this._initPlugin();
  }

  updateMessageForWebsite(websiteId, token, message) {
    if (token !== this.websites[websiteId].token) {
      console.error("Tokens does not match! Retry with a valid token.");

      return;
    }

    this.crispClient.pluginSubscriptions.updateSubscriptionSettings(
      websiteId,
      this._pluginId,

      { message: message }
    )
      .then(() => {
        this.websites[websiteId] = { message: message };

        console.log(
          `Successfully updated plugin config for website ID: ${websiteId}`
        );
      })
      .catch(error => {
        console.error(error);
      });
  }

  _initPlugin() {
    this.crispClient.setTier("plugin");
    this.crispClient.authenticate(this._apiIdentifier, this._apiKey);

    // Retrieve plugin ID for later use.
    this.crispClient.pluginConnect.connectAccount()
      .then(response => {
        this._pluginId = response.plugin_id;

        console.log(`Successfully retrived plugin ID: ${this._pluginId}`);
      })
      .catch(error => {
        console.error(error);
      });

    // Retrieve all websites connected to this plugin.
    this.crispClient.pluginConnect.listAllConnectWebsites(0, false)
      .then(websites => {
        let nbWebsites = (websites || []).length;

        if (nbWebsites === 0) {
          console.error(
            "No connected website retrieved. " +
              "Please add a trusted website in your Marketplace settings."
          );
        } else {
          for (const website of websites) {
            const message = website.settings.message || "Default message";

            this.websites[website.website_id] = {
              token: website.token,
              message: message,
            }

            nbWebsites++;
          }

          console.log(`Retrieved ${nbWebsites} connected websites!`);
          console.log("Websites configurations:");
          console.log(this.websites);

          this._events();
        }
      })
      .catch(error => {
        console.error(error)
      });
  }

  _events() {
    const self = this;

    this.crispClient.on("message:received", (event) => {
      console.log("Got \"message:received\" event:", event);

      self.crispClient.websiteConversations.sendMessage(
        event.website_id,
        event.session_id,

        {
          type: "text",
          from: "user",
          origin: self._pluginUrn,
          content: self.websites[event.website_id].message,
          user: {
            type: "participant",
            nickname: "Ping-pong",
            avatar: "https://crisp.chat/favicon-512x512.png",
          }
        }
      )
        .then(response => {
          console.log(response);
        })
        .catch(error => {
          console.error(error);
        });
    });

    this.crispClient.on("message:send", (event) => {
      console.log("Got \"message:send\" event:", event);
    });

    console.log("Now listening for events...");
  }
}

module.exports = PongPlugin;
