var chanManagerModule = require('./chanmanager.js');


var setup = function(io, dbConnector) {

    var chanManager = new chanManagerModule.ChanManager(io.sockets, dbConnector);

    io.sockets.on('connection', function(socket) {

        socket.on('login', function(nickname, callback) {
            chanManager.loginUser(nickname, socket, callback);
        });

        socket.on('send-message', function(chanName, message) {
           chanManager.computeMessage(chanName, message, socket)
        });

        socket.on('disconnect', function() {
            chanManager.disconnect(socket);
        });

        socket.on('chat-list', function(callback){
            callback(chanManager.chats);
        })

        socket.on('get-talks', function(callback) {
            dbConnector.findAll("Talk", {sort: {_id: -1}, limit: 10}, function(results) {
                callback(true, results);
            });
        });

      });
}

exports.setup = setup;
