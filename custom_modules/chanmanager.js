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
        this.systemCommand(message, this.currentChan.name);
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

ChanManager.prototype.systemCommand = function(message, chanName) {
    var commands = message.content.split(" ");
    var manager = this;

    if(commands[0] == "/logout") {
        manager.disconnect(this.socket);
    } else if (commands[0] == "/help") {
        manager.showHelp();
    } else if(commands[0] == "/join" && commands[1] != undefined && commands[1] != "Datalk") {
        manager.joinChan(commands[1], message.author);
    } else if(commands[0] == "/quit" && commands[1] != "Datalk" && chanName != "Datalk") {
        if(commands[1] == undefined) {
            manager.quitChan(chanName, message.author);
        } else {
            manager.quitChan(commands[1], message.author);
        }
    } else {

    }
}

ChanManager.prototype.showHelp = function() {
    this.socket.emit("show-help", this.currentChan.name, 
                    ["Welcome to Datalk !", 
                     "Here are the available commands :", 
                     "/join 'chan name', join or create a chan - alias (/j)",
                     "/quit 'chan name', quit the active chan if no name is given - alias (/q)",
                     "/logout, disconnect from the chat - alias(/l)",
                     "/help, provide information about the chat commands"]);

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
    var manager = this;
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
            if (chan.users.indexOf(manager.socket.nickname) != -1) {
               manager.removeFromChan(chan, manager.socket.nickname);
            }
        });
        this.socket.nickname = null;
        this.socket.emit("reset-chat");
    }
}


ChanManager.prototype.removeFromChan = function(chan, nickname) {
    var manager = this;

    chan.users.splice(chan.users.indexOf(nickname), 1);

    this.socket.emit("left-chan", chan.name);
    this.socket.leave(chan.name);
    this.sockets.in(chan.name).emit("user-left-chan", chan.name, nickname, chan.users.length);

    if(chan.users.length == 0) {
        delete manager.channels[chan.name];
        this.sockets.emit("display-channels", Object.keys(manager.channels));
    }   
}


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
    for(var chanName in manager.channels) {
        if(manager.channels.hasOwnProperty(chanName)) { 
            callback(manager.channels[chanName]);
        }
    }
}

exports.ChanManager = ChanManager;