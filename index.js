let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let path = require('path')

let onlineUsers = []

app.get('/', function(req, res){
  let express = require('express');
  app.use(express.static(path.join(__dirname)));
  res.sendFile(path.join(__dirname, '../chatter', 'index.html'));
})

// Register events on socket connection
io.on('connection', function(socket){
  console.log("we're connected")
  // Listen to chatMessage event sent by client and emit a chatMessage
  socket.on('chatMessage', function(message){
    io.to(message.receiver).emit('chatMessage', message)
  })

  // Listen to notifyTyping event sent by client and emit a notifyTyping to event to the client
  socket.on('notifyTyping', function(sender, receiver){
    io.to(receiver.id).emit('notifyTyping', sender, receiver);
  });

  // Listen to newUser event sent by client
  socket.on('newUser', function(user) {
    console.log("gonna push a new user into theonline users array")
    let newUser = {id: socket.id, name: user}
    onlineUsers.push(newUser);
    io.to(socket.id).emit('newUser', newUser);
    io.emit('onlineUsers', onlineUsers);
  })

  socket.on('disconnect', function(){
    onlineUsers.forEach(function(user, index){
      if (user.id === socket.id) {
        onlineUsers.splice(index, 1);
        io.emit('userIsDisconnected', socket.id);
        io.emit('onlineUsers, onlineUsers')
      }
    })
  })
})

http.listen(3000, function(){
  console.log('Listening on *.3000')
})