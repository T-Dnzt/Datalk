var chanManagerModule = require('./chanmanager.js');

var setup = function(io, dbConnector) {

    var chanManager = new chanManagerModule.ChanManager(io.sockets);

    io.sockets.on('connection', function(socket) {

        socket.on('login', function(nickname, callback) {
            chanManager.loginUser(nickname, callback, socket);
        });

        socket.on('send-message', function(chanName, message) {
           chanManager.sendMessage(dbConnector, chanName, message, socket)
        });

        socket.on('disconnect', function() {
            chanManager.disconnect(socket);
        });

        socket.on('chat-list', function(callback){
            callback(chanManager.chats);
        })

        socket.on('get-talks', function(callback) {
            dbConnector.findAll("Talk", {sort: {_id: -1}, limit: 15}, function(results) {
                callback(true, results);
            });
        });

      });
}

exports.setup = setup;
