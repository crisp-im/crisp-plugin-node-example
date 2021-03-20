const express = require("express");
const PongPlugin = require("./pong_plugin");

const pluginUrn = "urn:my.account:pluginname:0";
const crispAPIIdentifier = "change-me-please";
const crispAPIKey = "abcdefghijklmnopqrstuvwxyz";

const app = express();
const port = 1234;

const plugin = new PongPlugin(
  pluginUrn,
  crispAPIIdentifier,
  crispAPIKey
);

app.use(express.json());

app.use("/", express.static("public"));

app.use("/config/update", ((req) => {
    const websiteId = req.body.website_id;
    const message = req.body.message;
    const token = req.body.token;

    plugin.updateMessageForWebsite(websiteId, token, message)
}));

app.listen(port, () => {
    console.log(`Plugin now listening on port :${port}`)
});
