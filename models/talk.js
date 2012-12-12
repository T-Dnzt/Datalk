var collectionName = "talks";

var findAll = function(dbConnector, options, callback) {
  dbConnector.executeOnCollection(collectionName, function(collection) {
    collection.find({}, options).toArray(function(err, results){
      callback(results);
    });
  });
}

var save = function(talk, dbConnector, callback) {
    dbConnector.executeOnCollection(collectionName, function(collection) {

      var firstAuthor = talk[0].author;
      var messageID = "";
      var permalink = "";

      for(var i = 0; i < talk.length; i++) {
         message = talk[i];
         if(message.content.split(' ').length > 5 && message.author == firstAuthor) {
              messageID = message.content;
              break;
         }
      }

      if(messageID.length == 0) {
         messageID = talk[0].content;
      }

      var formattedMessageID = messageID.replace(/ /g,"-").replace(/\W/g, '-');
      permalink = formattedMessageID + "_" + firstAuthor;

      collection.insert({'first_author' : firstAuthor,
                         'sentence_id' : messageID,
                         'messages' : talk,
                         'permalink' : permalink });
      callback(permalink);
    });
};


exports.save = save;
exports.findAll = findAll;
exports.collectionName = collectionName;