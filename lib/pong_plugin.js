"use strict";

const Crisp = require("crisp-api");

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

    this.crispClient.plugin.updateSubscriptionSettings(
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
    this.crispClient.authenticateTier(
      "plugin", this._apiIdentifier, this._apiKey
    );

    // Retrieve plugin ID for later use.
    this.crispClient.plugin.getConnectAccount()
      .then(response => {
        this._pluginId = response.plugin_id;

        console.log(`Successfully retrived plugin ID: ${this._pluginId}`);
      })
      .catch(error => {
        console.error(error);
      });

    // Retrieve all websites connected to this plugin.
    // Notice #1: we only retrieve the first page there, you should implement \
    //   paging to the end, in a real-world situation.
    // Notice #2: return configured + non-configured plugins altogether.
    this.crispClient.plugin.listAllConnectWebsites(1, false)
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

      self.crispClient.website.sendMessageInConversation(
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
