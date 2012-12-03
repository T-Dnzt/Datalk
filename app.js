var flatiron = require('flatiron'),
    path = require('path'),
    app = flatiron.app,
    routes = require('./routes.js'),
    mongodb = require('mongodb'),
    Database = mongodb.Db,
    MongoServer = mongodb.Server;

var database = new Database('Datalk', new MongoServer("127.0.0.1", 27017, {}));
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http);

routes.match('/', 'index.html');
routes.match('/chat', 'chat.html');

app.start(3000);


var collectionUsers = null;
database.open(function(err, client) {
    client.collection('users', function(err, collection) {
        collectionUsers = collection;
    });
});
