//SERVER SIDE

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var exphbs  = require('express-handlebars');
var express = require('express');
var port = process.env.PORT || 3000;

var nicknames = [];
var chat = [];
var images = [];
var users = {};

app.set('view engine', 'handlebars'); //Set view engine to handlebars. (allow variables to be passed to html, give Vue.js a shot?)
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.use(express.static('public/images')); //Define the path to the static files such as images and css.

app.get('/', function(req, res){
  res.render('main.handlebars');
});

io.on('connection', function(socket){ //A user has connected to the server (each user is represented by a socket, like sessions in Flask.)
  /*
    Socket.IO sends data back and fouth from client to server and vice versa.
  */

  //server is listening for the creation of a new user... (When you click submit after typing in a username)
  socket.on('new user', function(data, callback) {
      if(data in users) {
          callback(false);
      }else {
          socket.nickname = data;
          users[socket.nickname] = socket;
          console.log('users[socket.nickname] = ' + users[socket.nickname].nickname);
          nicknames.push(socket.nickname);

          io.emit('update online', nicknames);
          io.emit('usernames', nicknames);
          callback(true, socket.nickname);
          socket.broadcast.emit('send message', socket.nickname + ' connected.');
      }
  });

  socket.on('send message', function(msg){
      //we tell client to execute send message
      var msg = msg.trim();
      if(msg.substr(0,3) == '/w ') {
          var cleaner = msg.substring(3);
          var ind = cleaner.indexOf(' ');
          var name = msg.substr(3, ind);
          users[name].emit('whisper', socket.nickname, msg, false);
      } else {
          if(socket.nickname == chat[chat.length-1]) {
              io.emit('send message', socket.nickname, msg, true);
          } else {
              /*
              var newMsg = new Chat({msg: msg, nick: socket.nickname});
              newMsg.save(function(err) {
                if(err) throw err;
              });
              */
              io.emit('send message', socket.nickname, msg, false);
              chat.push(socket.nickname);
          }
      }
  });

  socket.on('disconnect', function() {
      if(!socket.nickname) return;
      delete users[socket.nickname];
      var ind = nicknames.indexOf(socket.nickname);
      nicknames.splice(ind,1);

      io.emit('update online', nicknames);
      socket.broadcast.emit('send message', socket.nickname + ' disconnected.');
  });

});

http.listen(port, function(){
    console.log('listening on localhost:' + port);
});


/*
  Socket is a session for every client, just like sessions in Python.
*/
