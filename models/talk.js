var modelName = "Talk";
var collectionName = "talks";

var findAll = function(collection, options, callback) {
    collection.find({}, options).toArray(function(err, results){
      callback(results);
    });
}

var save = function(collection, talk, callback) {

      var firstAuthor = talk.talkMessages[0].author;
      var messageID = "";
      var permalink = "";

      for(var i = 0; i < talk.talkMessages.length; i++) {
         message = talk.talkMessages[i];
         if(message.content.split(' ').length > 5 && message.author == firstAuthor) {
              messageID = message.content;
              break;
         }
      }

      if(messageID.length == 0) {
         messageID = talk.talkMessages[0].content;
      }

      collection.findOne({sentence_id: messageID}, function(err, result){
        var formattedMessageID = messageID.replace(/ /g,"-").replace(/\W/g, '-');

        if(result) {
          var randomNumber = Math.floor(Math.random()*10001);
          permalink = formattedMessageID + "_" + firstAuthor + "_" + randomNumber;
        } else {
          permalink = formattedMessageID + "_" + firstAuthor;
        }
        

        collection.insert({'first_author' : firstAuthor,
                           'sentence_id' : messageID,
                           'messages' : talk.talkMessages,
                           'permalink' : permalink,
                           'chan_name' : talk.chanName });
        callback(permalink);
      });
      

};


exports.save = save;
exports.findAll = findAll;
exports.collectionName = collectionName;
exports.modelName = modelName;