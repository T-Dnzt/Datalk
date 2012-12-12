$(document).ready(function(){
            
  $( "#tabs" ).tabs();
  var socket = io.connect('http://localhost');

  $('#username').focus();

   $('#connect').click(function(e) {
      e.preventDefault();
      var nickname = $("#username").val();

      if(nickname) {
          socket.emit('login', nickname, function(success) {
              if(success) {
                  $('#login').hide();
                  $('#talks').hide();
                  $('#tabs').show();
              } else {
                $('#existing-nickname').show();
              }
          });
      } else {
        $('#auth-fail').show();
      }   
  });

   var chanDiv = function(chanName, subElement) {
      if(subElement) {
        return $('#' + chanName + ' ' + subElement)
      } else {
        return $('#' + chanName);
      }
   }

  var displayChannels = function(channels) {
    var channelsList = $('.channels-list');
    channelsList.html("");
    $.each(channels, function(i, chan) {
      $('#datalkLiTmpl').tmpl({name: chan}).appendTo(channelsList)
    });
  }  

   var createChan = function(data) {

      $('#datalkChatTmpl').tmpl({chan : data.chanName}).appendTo('#tabs');
      $('#tabs').tabs('add', "#"+data.chanName, "#"+data.chanName);
      $( "#tabs" ).tabs( 'select', $( "#tabs" ).tabs('length') - 1);

      chanDiv(data.chanName, '.chatname').html("Channel #" + data.chanName);
      chanDiv(data.chanName, '.users-count').html(data.users.length);

      $.each(data.messages, function(i, msg) { 
        $('#datalkMessageTmpl').tmpl({author: msg.author, message: msg.content}).appendTo(chanDiv(data.chanName, '.messages'))
      });

      $.each(data.users, function(i, nick) { 
        $('#datalkLiTmpl').tmpl({name: nick}).appendTo(chanDiv(data.chanName, '.users-list')) });

      displayChannels(data.channels);

      chanDiv(data.chanName, '.message-input').focus();

      chanDiv(data.chanName, '.message-form').submit(function(e) {
        e.preventDefault();
        var message = chanDiv(data.chanName, '.message-input').val();
        if(message)
        {
          socket.emit('send-message', data.chanName, {author: data.nickname, content: message});
          chanDiv(data.chanName, '.message-input').val("");
        }
      });
  }

  socket.emit('get-talks', function(success, talks) {
    if(success) {
      $.each(talks, function(i, talk) { 
        $('#talkTmpl').tmpl({id: talk._id, permalink: talk.permalink, title: talk.permalink}).appendTo("#talks-list");
      });
    }
  });

  socket.on("join-chan", function(data) {
    createChan(data);
  });

  socket.on("left-chan", function(chanName) {
    $('#tabs').tabs('remove', "#"+chanName, "#"+chanName);
    $('#tabs').remove("#"+chanName);
  });

  socket.on("reset-chat", function() {
    $('#login').show();
    $('#talks').show();
    $('#tabs').hide();
  });

  socket.on('new-message', function(chanName, message) {
    $('#datalkMessageTmpl').tmpl({author: message.author, message: message.content}).appendTo('#'+chanName+' .messages');
    chanDiv(chanName, '.messages').scrollTop(chanDiv(chanName, '.messages').prop("scrollHeight") - chanDiv(chanName, '.messages').height());
  });

  socket.on('new-talk', function(chanName, permalink) {
    $('#newTalkMessageTmpl').tmpl({permalink: permalink}).appendTo(chanDiv(chanName, '.messages'));             
  });

  //New user logged in
  socket.on("new-user", function(chanName, nickname, usersCount) {
    chanDiv(chanName, '.users-count').html(usersCount);
    $('#datalkLiTmpl').tmpl({name: nickname}).appendTo('#'+chanName+' .users-list');
    chanDiv(chanName, '.messages').append("<li>"+ nickname + " joined.</li>");
  });

  socket.on("display-channels", function(channels) {
    displayChannels(channels);
  });

  socket.on("delete-chan", function(channels) {
    displayChannels(channels);
  });

  socket.on("user-left-chan", function(chanName, nickname, usersCount) {
    chanDiv(chanName, '.users-count').html(usersCount);
    chanDiv(chanName, '.li-' + nickname).remove();
    var message = nickname + " has left the channel.";
    $("#systemMessageTmpl").tmpl({message: message}).appendTo(chanDiv(chanName, '.messages'));
    chanDiv(chanName, '.messages').scrollTop(chanDiv(chanName, '.messages').prop("scrollHeight") - chanDiv(chanName, '.messages').height());
  });  
});