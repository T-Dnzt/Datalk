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

routes.match('/', 'index.html', 'text/html');
routes.match('/app', 'app.css', 'text/css');

app.start(3000);

var io = require('socket.io').listen(app.server);

var users = [];
var messages = [];
var talk = [];

io.sockets.on('connection', function(socket) {

    socket.on('login', function(nickname, callback) {
        socket.nickname = nickname;
        users.push(nickname);
        socket.broadcast.emit("new-user", nickname, users);
        callback(true, messages, users);
    });

    socket.on('send-message', function(message) {
        messages.push(message);
        io.sockets.emit("new-message", message);
    });

    socket.on('disconnect', function() {
        if(socket.nickname)
        {
            users.splice(users.indexOf(socket.nickname), 1);
            io.sockets.emit("user-logged-out", socket.nickname, users.length);
        }
    });

});
