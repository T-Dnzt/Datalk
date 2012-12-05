var mongodb = require('mongodb'),
    Database = mongodb.Db,
    MongoServer = mongodb.Server;

function DBConnector(dbName, address) {
  this.db = new Database(dbName, new MongoServer(address, 27017, {auto_reconnect: true}));
  this.db.open(function(){});
}

DBConnector.prototype.executeOnCollection = function(collectionName, callback) {
  console.log("Execute something on " + collectionName);
  this.db.collection(collectionName, function(err, collection) {
    if(collection) {
      callback(collection); 
    }     
  });
}

exports.DBConnector = DBConnector;