const express = require('express')
const app = express()
const port = 1234
const PongPlugin = require('./pong_plugin')

const plugin = new PongPlugin();

app.use(express.json());

app.use('/', express.static('public'));

app.use('/config/update', ((req) => {
    const websiteId = req.body.website_id;
    const message = req.body.message;

    plugin.updateMessageForWebsite(websiteId, message)
}));

app.listen(port, () => {
    console.log(`Plugin now listening on port :${port}`)
});