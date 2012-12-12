var mongodb = require('mongodb'),
    Database = mongodb.Db,
    MongoServer = mongodb.Server;

function DBConnector(dbName, address) {
  this.db = new Database(dbName, new MongoServer(address, 27017, {auto_reconnect: true}));
  this.db.open(function(){});
  this.models = [];
}

DBConnector.prototype.executeOnModel = function(modelName, callback) {
  this.db.collection(this.models[modelName].collectionName, function(err, collection) {
    if(collection) {
      callback(collection); 
    } else {
      console.log("Error while accessing " + modelName)
    }
  });
}

DBConnector.prototype.addModel = function(modelName, model) {
  this.models[modelName] = model;
}

DBConnector.prototype.save = function(modelName, data, callback) {
  this.executeOnModel(modelName, function(collection) {
    this.models[modelName].save(collection, data, callback);
  });
}

//{sort: {_id: -1}, limit: 15}
DBConnector.prototype.findAll = function(modelName, options, callback) {
  var connector = this;
  this.executeOnModel(modelName, function(collection) {
    connector.models[modelName].findAll(collection, options, function(results) {
        callback(results);
    });
  });
}

exports.DBConnector = DBConnector;