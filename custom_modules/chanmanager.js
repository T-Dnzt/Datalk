function Chan(name) {
  this.name = name;
  this.users = [];
  this.messages = [];
  this.talkMessages = [];
  this.timeOut = null;
}

function ChanManager(sockets) {
    this.channels = [];
    this.sockets = sockets;
    this.socket = null;
    this.currentChan = null;
}

ChanManager.prototype.loginUser = function(nickname, callback, socket) {
    this.currentChan = this.getChan("Datalk");
    this.socket = socket;
    if(this.currentChan.users.indexOf(nickname) == -1) {
        this.socket.nickname = nickname;
        callback(true);
        this.joinChan(this.currentChan.name, nickname, this.socket, this.sockets)
    } else {
        callback(false);
    }
}

ChanManager.prototype.sendMessage = function(dbConnector, chanName, message, socket) {
    this.currentChan = this.getChan(chanName);
    this.socket = socket;

    if(message.content[0] == "/") {
        this.systemCommand(message, this.socket, this.sockets);
    } else {
        this.currentChan.messages.push(message);

        this.currentChan.talkMessages.push(message);

        this.sockets.in(this.currentChan.name).emit("new-message", this.currentChan.name, message);

        if(this.currentChan.timeOut) {
            clearTimeout(this.currentChan.timeOut);
        }

        this.currentChan.timeOut = setTimeout(function() {
            dbConnector.save("Talk", this.currentChan.talkMessages, function(permalink) {
                this.sockets.in(this.currentChan.name).emit("new-talk", this.currentChan.name, permalink);
            });

            this.currentChan.talkMessages = [];
        }, 300000);
    }
}

ChanManager.prototype.systemCommand = function(command) {
    var args = command.content.split(" ");
    var manager = this;

    if(args[0] == "/logout") {
        manager.disconnect(socket, sockets);
    } else if (args[0] == "/help") {

    } else if(args[0] == "/join" && args[1] != undefined && args[1] != "main") {
        manager.joinChan(args[1], command.author);
    } else if(args[0] == "/quit" && args[1] != "main") {
        manager.quitChan(args[1], command.author);
    } else {

    }
}


ChanManager.prototype.joinChan = function(chanName) {
    this.currentChan = this.getChan(chanName);

    this.currentChan.users.push(this.socket.nickname);
    this.sockets.emit("display-channels", Object.keys(this.channels));
    this.sockets.in(this.currentChan.name).emit("new-user", this.currentChan.name, this.socket.nickname, this.currentChan.users.length);
    this.socket.join(this.currentChan.name);
    this.socket.emit("join-chan", {messages : this.currentChan.messages, users: this.currentChan.users,
                                   chanName: this.currentChan.name, channels: Object.keys(this.channels),
                                   nickname: this.socket.nickname});
    //IS SPARTA
}

 
ChanManager.prototype.quitChan = function(chanName, nickname) {
    this.doForEachChan(function(chan){
        if (chan.name == chanName && chan.users.indexOf(nickname) != -1) {
           manager.removeFromChan(chan, nickname);
        }
    })  
}


ChanManager.prototype.disconnect = function(socket) {
    var manager = this;
    this.socket = socket;
    if(this.socket.nickname)
    {
        this.doForEachChan(function(chan) {
            if (chan.users.indexOf(this.socket.nickname) != -1) {
               manager.removeFromChannel(chan, this.socket.nickname);
            }
        });
        this.socket.nickname = null;
        this.socket.emit("reset-chat");
    }
}


ChanManager.prototype.removeFromChan = function(chan, nickname) {
    var manager = this;

    chan.users.splice(chan.users.indexOf(nickname), 1);

    socket.emit("left-chan", chan.name);
    socket.leave(chan.name);
    sockets.in(chan.name).emit("user-left-chan", chan.name, nickname, chan.users.length);

    if(chan.users.length == 0) {
        delete manager.channels[chan.name];
        sockets.emit("display-channels", Object.keys(manager.channels));
    }   
}

/********************/
ChanManager.prototype.getChan = function(chanName) {
    if(this.channels[chanName]) {
        return this.channels[chanName];
    } else {
        this.channels[chanName] = new Chan(chanName);
        return this.channels[chanName];
    }
}

ChanManager.prototype.doForEachChan = function(callback) {
    var manager = this;
    for(var chan in manager.channels) {
        if(manager.channels.hasOwnProperty(chan.name)) { 
            callback(manager.chats[chan.name]);
        }
    }
}

exports.ChanManager = ChanManager;