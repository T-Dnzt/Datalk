function Chat(name) {
  this.name = name;
  this.users = [];
  this.messages = [];
  this.talkMessages = [];
  this.timeOut = null;
}

function ChatsManager() {
    this.chats = [];
}

ChatsManager.prototype.getChat = function(chatname) {
    if(this.chats[chatname]) {
        return this.chats[chatname];
    } else {
        this.chats[chatname] = new Chat(chatname);
        return this.chats[chatname];
    }
}

ChatsManager.prototype.doForEachChat = function(callback) {
    var manager = this;
    for(var chatname in manager.chats) {
        if(manager.chats.hasOwnProperty(chatname)) { 
            var chat = manager.chats[chatname];
            callback(chat);
        }
    }
}

ChatsManager.prototype.systemCommand = function(command, socket, sockets) {
    var args = command.content.split(" ");
    var manager = this;

    if(args[1] != undefined && args[1] != "main") {
        switch(args[0]) {
            case "/join":
                manager.joinChannel(args[1], command.author, socket, sockets);
                break;
            case "/quit": 
                manager.leaveChannel(args[1], command.author, socket, sockets);
                break;
            default:
                break;
        }
    }
}

ChatsManager.prototype.joinChannel = function(chatname, nickname, socket, sockets) {
    var chat = this.getChat(chatname);
    chat.users.push(nickname);
    sockets.emit("new-chan", Object.keys(this.chats));
    socket.emit("join-channel", chat.messages, chat.users, chat.name, Object.keys(this.chats));
    sockets.in(chat.name).emit("new-user", nickname, chat.users, chat.name);
    socket.join(chat.name);
}
 
ChatsManager.prototype.leaveChannel = function(chatname, nickname, socket, sockets) {
    var manager = this;
    this.doForEachChat(function(chat){
        if (chat.name == chatname && chat.users.indexOf(nickname) != -1) {
            chat.users.splice(chat.users.indexOf(nickname), 1);

            socket.emit("left-channel", chat.name);
            socket.leave(chat.name);
            sockets.in(chat.name).emit("user-left-chan", nickname, chat.users.length, chat.name);

            if(chat.users.length == 0) {
                delete manager.chats[chatname];
                sockets.emit("delete-chan", Object.keys(manager.chats));
            }   
        }
    })
   
}

var setup = function(io, dbConnector, Talk) {

    var chatsManager = new ChatsManager();

    io.sockets.on('connection', function(socket) {

    socket.on('chatConnect', function(chatname, nickname, callback) {
        joinChannel(chatname, nickname, socket);
        //callback();
    })

    socket.on('chatDisconnect', function(chatname, callback) {
        var chat = chatsManager.getChat(chatname);
        chat.users.splice(chat.users.indexOf(socket.nickname), 1);
        socket.leave(chat.name);
        //callback
    })

    socket.on('login', function(nickname, callback) {
        var chat = chatsManager.getChat("main");

        if(chat.users.indexOf(nickname) == -1) {
            socket.nickname = nickname;
            chatsManager.joinChannel(chat.name, nickname, socket, io.sockets)
            callback(true, chat.messages, chat.users, chat.name, Object.keys(chatsManager.chats));
        } else {
            callback(false);
        }
    });

    socket.on('chat-list', function(callback){
        callback(chatsManager.chats);
    })

    socket.on('gettalks', function(callback) {
        Talk.findAll(dbConnector, {sort: {_id: -1}, limit: 15}, function(results) {
            callback(true, results);
        });
    });

    socket.on('send-message', function(message, chatname) {
        var chat = chatsManager.getChat(chatname);

        if(message.content[0] == "/") {
            chatsManager.systemCommand(message, socket, io.sockets);
        } else {

            chat.messages.push(message);
            chat.talkMessages.push(message);

            io.sockets.in(chat.name).emit("new-message", message, chat.name);

            if(chat.timeOut) {
                clearTimeout(chat.timeOut);
            }

            chat.timeOut = setTimeout(function() {
                var permalink = Talk.save(chat.talkMessages, dbConnector, function(permalink) {
                    io.sockets.in(chat.name).emit("new-talk", permalink, chat.name);
                });

                chat.talkMessages = [];
            }, 300000);
        }
    });

    socket.on('disconnect', function() {
        if(socket.nickname)
        {
            chatsManager.doForEachChat(function(chat) {
                if (chat.users.indexOf(socket.nickname) != -1) {
                    chat.users.splice(chat.users.indexOf(socket.nickname), 1);
                    io.sockets.emit("user-left-chan", socket.nickname, chat.users.length, chat.name);
                }
            })
        }
    });

  });
}

exports.setup = setup;
