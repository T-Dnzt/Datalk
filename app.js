var flatiron = require('flatiron'),
    path = require('path'),
    app = flatiron.app,
    routes = require('./custom_modules/routes.js'),
    dbAccess = require('./custom_modules/dbconnector.js'),
    dbConnector = new dbAccess.DBConnector("Datalk", "127.0.0.1")
    connect = require('connect'),
    Talk = require('./models/talk.js'),
    socketIO = require('./custom_modules/realtime.js');

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });
app.use(flatiron.plugins.http, { before : [connect.static("public")] });

//Routes
routes.defineStaticPages();
dbConnector.executeOnCollection(Talk.collectionName, routes.defineResources);

//Start the server and socket.io
app.start(3000);

var io = require('socket.io').listen(app.server);
socketIO.setup(io, dbConnector, Talk);
    