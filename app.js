var flatiron = require('flatiron'),
    path = require('path'),
    app = flatiron.app,
    router = require('./routes.js');

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http);


router.match('/', 'index.html');
router.match('/chat', 'chat.html');

app.start(3000);