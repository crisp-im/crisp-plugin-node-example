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
    const token = req.body.token;

    plugin.updateMessageForWebsite(websiteId, token, message)
}));

app.listen(port, () => {
    console.log(`Plugin now listening on port :${port}`)
});
