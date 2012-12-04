var saveTalk = function(talk, collectionTalks) {

    console.log("Save new talk");
    var firstAuthor = talk[0].author;
    var messageID = "";
    var permalink = "";

    for(var i = 0; i < talk.length; i++)
    {
       message = talk[i];
       if(message.content.split(' ').length > 5 && message.author == firstAuthor)
       {
            messageID = message.content;
            break;
       }
    }

    if(messageID.length > 0)
    {
        var formattedMessageID = messageID.replace(/ /g,"-").replace(/\W/g, '-');
        permalink = formattedMessageID + "_" + firstAuthor;
    }   
    else
    {
        permalink = firstAuthor;
    }

    collectionTalks.insert({'first_author' : firstAuthor,
                           'sentence_id' : messageID,
                           'messages' : talk,
                           'permalink' : permalink });

    talk = [];
};

exports.saveTalk = saveTalk;
