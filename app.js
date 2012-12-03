var flatiron = require('flatiron'),
    path = require('path'),
    app = flatiron.app,
    routes = require('./routes.js');

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http);

routes.match('/', 'index.html');
routes.match('/chat', 'chat.html');

app.start(3000);
