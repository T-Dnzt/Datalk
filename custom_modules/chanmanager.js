var twitter = require('./twitterconnector.js');

function Chan(name) {
  this.name = name;
  this.users = [];
  this.messages = [];
  this.talkMessages = [];
  this.timeOut = null;
  this.twitter = null;
}

//The ChanManager class represents the engine of the chat.
//It will manage the channels based on events received in realtime.js.
function ChanManager(sockets, dbConnector) {
    this.channels = [];
    this.sockets = sockets;
    this.dbConnector = dbConnector;
}


ChanManager.prototype.loginUser = function(nickname, socket, callback) {
    var chan = this.getChan("Datalk");

    if(chan.users.indexOf(nickname) == -1) {
        socket.nickname = nickname;
        callback(true);
        this.joinChan(chan.name, socket, nickname)
    } else {
        callback(false);
    }
}

ChanManager.prototype.computeMessage = function(chanName, message, socket) {
    var currentChan = this.getChan(chanName);

    if(message.content[0] == "/") {
        this.systemCommand(currentChan, socket, message);
    } else {
       this.sendMessage(currentChan, message, true);
    }
}


ChanManager.prototype.disconnect = function(socket) {
    var manager = this;

    if(socket.nickname)
    {
        this.doForEachChan(function(chan) {
            if (chan.users.indexOf(socket.nickname) != -1) {
                manager.removeFromChan(chan, socket, socket.nickname);
            }
        });
        socket.nickname = null;
        socket.emit("reset-chat");
    }
}

ChanManager.prototype.sendMessage = function(chan, message, userMessage) {

    chan.messages.push(message);
    chan.talkMessages.push(message);

    this.sockets.in(chan.name).emit("new-message", chan.name, message);

    if(userMessage == true) {
        if(chan.timeOut) {
            clearTimeout(chan.timeOut);
        }

        var manager = this;

        chan.timeOut = setTimeout(function() {
            var talk = {talkMessages: chan.talkMessages, chanName: chan.name};
            manager.dbConnector.save("Talk", talk, function(permalink) {
                manager.sockets.in(chan.name).emit("new-talk", chan.name, permalink);
            });

            chan.talkMessages = [];
        }, 300000);
    }
}

//Handles commands typed by users
ChanManager.prototype.systemCommand = function(chan, socket, message) {
    var commands = message.content.split(" ");
    var manager = this;

    if(commands[1]) {
        commands[1] = commands[1].replace(/#/g, '' );
    }

    if(commands[0] == "/logout" || commands[0] == "/l") {
        this.disconnect(socket);
    } else if (commands[0] == "/help" || commands[0] == "/h") {
        this.showHelp();
    } else if(commands[0] == "/join" || commands[0] == "/j" && commands[1] != undefined && commands[1] != "Datalk") {
        this.joinChan(commands[1], socket, message.author);
    } else if(commands[0] == "/quit" || commands[0] == "/q" && commands[1] != "Datalk" && chan.name != "Datalk") {
        if(commands[1] == undefined) {
            this.quitChan(chan.name, socket, message.author);
        } else {
            this.quitChan(commands[1], socket, message.author);
        }
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

ChanManager.prototype.joinChan = function(chanName, socket, nickname) {
    var chan = this.getChan(chanName);
    var manager = this;

    if(chan.twitter == undefined) {
        chan.twitter = new twitter.TwitterConnector();
    }

    if(chan.users.indexOf(nickname) == -1) {

        chan.twitter.setup(chan.name, function(message) {
            if(message) {
                manager.sendMessage(chan, message, false);
            }
        });

        chan.users.push(socket.nickname);
        this.sockets.emit("display-channels", Object.keys(this.channels));
        this.sockets.in(chan.name).emit("new-user", chan.name, socket.nickname, chan.users.length);
        socket.join(chan.name);
        socket.emit("join-chan", {messages : chan.messages, users: chan.users,
                                  chanName: chan.name, channels: Object.keys(this.channels),
                                  nickname: socket.nickname});
        //IS SPARTA
    }
}


ChanManager.prototype.quitChan = function(chanName, socket, nickname) {
    var manager = this;
    this.doForEachChan(function(chan){
        if (chan.name == chanName && chan.users.indexOf(nickname) != -1) {
            manager.removeFromChan(chan, socket, nickname);
        }
    })
}

//Remove a user from a specified chan
ChanManager.prototype.removeFromChan = function(chan, socket, nickname) {
    var manager = this;

    chan.users.splice(chan.users.indexOf(nickname), 1);

    socket.emit("left-chan", chan.name);
    socket.leave(chan.name);
    this.sockets.in(chan.name).emit("user-left-chan", chan.name, nickname, chan.users.length);

    if(chan.users.length == 0) {
        clearInterval(chan.twitter.interv);
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