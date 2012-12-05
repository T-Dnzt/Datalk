var users = [],
    messages = [],
    talk = [],
    timeOut = null;

var setup = function(io, dbConnector, Talk) {

io.sockets.on('connection', function(socket) {

    socket.on('login', function(nickname, callback) {
        socket.nickname = nickname;
        users.push(nickname);
        socket.broadcast.emit("new-user", nickname, users);
        callback(true, messages, users);
    });

    socket.on('gettalks', function(callback) {
        Talk.findAll(dbConnector, function(results) {
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
            Talk.save(talk, dbConnector);
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
}

exports.setup = setup;
