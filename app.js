var flatiron = require('flatiron'),
    path = require('path'),
    app = flatiron.app,
    routes = require('./custom_modules/routes.js'),
    dbAccess = require('./custom_modules/dbconnector.js'),
    dbConnector = new dbAccess.DBConnector("Datalk", "127.0.0.1"),
    fs = require('fs'),
    connect = require('connect'),
    socketIO = require('./custom_modules/realtime.js');


app.config.file({ file: path.join(__dirname, 'config', 'config.json') });
app.use(flatiron.plugins.http, { before : [connect.static("public")] });


routes.defineStaticPages();

var modelsDir = 'models';
fs.readdir(modelsDir, function(err, list) {
    list.forEach(function (file) {
      var tmpModel = require('./'+modelsDir+'/'+file)
      dbConnector.addModel(tmpModel.modelName, tmpModel);
      dbConnector.executeOnModel(tmpModel.modelName, routes.defineResources);
    });
});

//Start the server and socket.io
app.start(3000);

var io = require('socket.io').listen(app.server);
io.set('log level', 1);
socketIO.setup(io, dbConnector);
    