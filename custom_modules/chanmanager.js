var twitter = require('./twitterconnector.js');

function Chan(name) {
  this.name = name;
  this.users = [];
  this.messages = [];
  this.talkMessages = [];
  this.timeOut = null;
  this.twitter = null;
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
    var currentChan = this.getChan(chanName);
    this.socket = socket;
    var manager = this;

    if(message.content[0] == "/") {
        this.systemCommand(message, currentChan.name, dbConnector);
    } else {
        console.log("new message");
        currentChan.messages.push(message);
        currentChan.talkMessages.push(message);

        this.sockets.in(currentChan.name).emit("new-message", currentChan.name, message);

        if(currentChan.timeOut) {
            clearTimeout(currentChan.timeOut);
        }

        currentChan.timeOut = setTimeout(function() {
            var talk = {talkMessages: currentChan.talkMessages, chanName: currentChan.name};
            dbConnector.save("Talk", talk, function(permalink) {
                manager.sockets.in(currentChan.name).emit("new-talk", currentChan.name, permalink);
            });

            currentChan.talkMessages = [];
        }, 300000);
    }
}

ChanManager.prototype.systemCommand = function(message, chanName, dbConnector) {
    var commands = message.content.split(" ");
    var manager = this;

    if(commands[1]) {
        commands[1] = commands[1].replace(/#/g, '' );
    }

    if(commands[0] == "/logout" || commands[0] == "/l") {
        manager.disconnect(this.socket);
    } else if (commands[0] == "/help" || commands[0] == "/h") {
        manager.showHelp();
    } else if(commands[0] == "/join" || commands[0] == "/j" && commands[1] != undefined && commands[1] != "Datalk") {
        manager.joinChan(commands[1], message.author, dbConnector);
    } else if(commands[0] == "/quit" || commands[0] == "/q" && commands[1] != "Datalk" && chanName != "Datalk") {
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

ChanManager.prototype.joinChan = function(chanName, nickname, dbConnector) {
    this.currentChan = this.getChan(chanName);
    var manager = this;

    this.currentChan.twitter = new twitter.TwitterConnector();


    if(this.currentChan.users.indexOf(nickname) == -1) {

        if(this.currentChan.twitter.init == false) {
            this.currentChan.twitter.init = true;
            this.currentChan.twitter.interv = setInterval(function(){
                manager.currentChan.twitter.search(chanName, function(message) {
                    console.log(message);
                    if(message) {
                        console.log(message.content);
                       manager.sendMessage(dbConnector, chanName, message, manager.socket);
                    } 
                });
            }, 180000);
        }

        this.currentChan.users.push(this.socket.nickname);
        this.sockets.emit("display-channels", Object.keys(this.channels));
        this.sockets.in(this.currentChan.name).emit("new-user", this.currentChan.name, this.socket.nickname, this.currentChan.users.length);
        this.socket.join(this.currentChan.name);
        this.socket.emit("join-chan", {messages : this.currentChan.messages, users: this.currentChan.users,
                                       chanName: this.currentChan.name, channels: Object.keys(this.channels),
                                       nickname: this.socket.nickname});
        //IS SPARTA
    }
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
        clearInterval(manager.currentChan.twitter.interv);
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