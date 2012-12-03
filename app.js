var flatiron = require('flatiron'),
    path = require('path'),
    app = flatiron.app,
    routes = require('./routes.js'),
    mongodb = require('mongodb'),
    Database = mongodb.Db,
    MongoServer = mongodb.Server,
    connect = require('connect');

var database = new Database('Datalk', new MongoServer("127.0.0.1", 27017, {}));
app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.http,
        { before : [connect.static("public")] });

routes.match('/', 'index.html');

app.start(3000);

var io = require('socket.io').listen(app.server);

var collectionUsers = null;
database.open(function(err, client) {
    client.collection('users', function(err, collection) {
        collectionUsers = collection;
    });
});

io.sockets.on('connection', function(socket) {
    socket.on('login', function(nickname) {
        if (nickname)
        {
            console.log("New chatter:"+nickname)
            collectionUsers.findAndModify({nickname: nickname}, [['_id','asc']], {$set: {nickname: nickname}}, 
            {upsert:true, new:true}, function(err, result) {
              io.sockets.emit('correct', nickname);
            });

        } else {
            console.log("No nickname");
            io.sockets.emit('incorrect');
        }
    });
});
