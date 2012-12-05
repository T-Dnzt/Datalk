var flatiron = require('flatiron'),
    path = require('path'),
    app = flatiron.app,
    routes = require('./routes.js'),
    dbAccess = require('./dbaccess.js'),
    mongodb = require('mongodb'),
    Database = mongodb.Db,
    MongoServer = mongodb.Server,
    connect = require('connect');

var database = new Database('Datalk', new MongoServer("127.0.0.1", 27017, {}));

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });
app.use(flatiron.plugins.http, { before : [connect.static("public")] });


//Routing & Collection access
var collections = {};
database.open(function(err, client) {
    client.collection('talks', function(err, collection) {
        collections.talks = collection;
        routes.defineResources(collections.talks)
    });
});

routes.defineStaticPages();
 
//Start the server and socket.io
app.start(3000);
var io = require('socket.io').listen(app.server);

var users = [];
var messages = [];
var talk = [];
var timeOut = null;



io.sockets.on('connection', function(socket) {

    var startTalkSaving = function() {
        dbAccess.saveTalk(talk, collections.talks);
    }      

    socket.on('login', function(nickname, callback) {
        socket.nickname = nickname;
        users.push(nickname);
        socket.broadcast.emit("new-user", nickname, users);
        callback(true, messages, users);
    });

    socket.on('gettalks', function(callback) {
        console.log("fu");
        collections.talks.find().toArray(function(err, results){
            callback(true, results);
        });
    });

    socket.on('send-message', function(message) {
        messages.push(message);
        talk.push(message);
        io.sockets.emit("new-message", message);

        if(timeOut) {
            clearTimeout(timeOut); 
        }

        timeOut = setTimeout(function() {
            dbAccess.saveTalk(talk, collections.talks);
            talk = [];
        }, 5000);
    });

    socket.on('disconnect', function() {
        if(socket.nickname)
        {
            users.splice(users.indexOf(socket.nickname), 1);
            io.sockets.emit("user-logged-out", socket.nickname, users.length);
        }
    });

});
