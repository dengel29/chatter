// client side functionality, referenced in index.html

let socket = io();
let allChatMessages = [];
let chatNotificationCount = [];
let myUser = {}
let myFriend = {};

//Document ready function called automatically on page load



  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    loginMe();
  } else {
    document.addEventListener('DOMContentLoaded', loginMe)
  }


// function to ask user to supply name before entering chatbox

function loginMe(){
  let person = prompt("Please enter your name:", "Dan Engel");

  if (/([^\s])/.test(person) && person != null && person != ""){
    console.log("new user!")
    socket.emit('newUser', person);
    document.title = person;
  } else {
    location.reload();
  }
}

// function to call when sent a message from chatbox

function submit(){
  let message = {};
  let text = document.getElementById('m').value();
  let messageParentElement = document.getElementById('messages')

  if (text != '') {
    message.text = text;
    message.sender = myUser.id;
    message.receiver = myFriend.id;

    messageParentElement.appendChild('<li class="chatMessageRight">' + message.text + '</li>')

    if(allChatMessages[myFriend.id] != undefined) {
      allChatMessages[myFriend.id].push(message);
    } else {
      allChatMessages[myFriend.id] = new Array(message);
    }
    socket.emit('chatMessage', message);
  }
  document.getElementById('m').val('').focus();
  return false;
}

function appendChatMessage(message){
  if (message.receiver == myUser.id && message.sender == myFriend.id) {
    playNewMessageAudio();
    let cssClass = (message.sender == myUser.id) ? 'chatMessageRight' : 'chatMessageLeft';
    document.getElementById('messages').appendChild('<li class="' + cssClass + '">' + message.text + '</li>')
  }
  else {
    playNewMessageNotificationAudio();
    updateChatNotificationCount(message.sender);
  }

  if (allChatMessages[message.sender] != undefined) {
    allChatMessages[message.sender].push(message);
  } else {
    allChatMessages[message.sender] = new Array(message);
  }
}

// plays audio when new message arrives on selected chatbox

function playNewMessageAudio(){
  (new Audio('https://notificationsounds.com/soundfiles/8b16ebc056e613024c057be590b542eb/file-sounds-1113-unconvinced.mp3')).play();
}

// Function to play a audio when new message arrives on selected chatbox
function playNewMessageNotificationAudio() {
  (new Audio('https://notificationsounds.com/soundfiles/dd458505749b2941217ddd59394240e8/file-sounds-1111-to-the-point.mp3')).play();
}

// update chat notification count

function updateChatNotificationCount(userId) {
  let count = (chatNotificationCount[userId] == undefined) ? 1 : chatNotificationCount[userId] + 1;
  chatNotificationCount[userId] = count;
  let label = document.getElementsByTagName('label')[0]
  document.getElementById(`${userId} ${label.chatNotificationCount}`).innerHTML = count;
  document.getElementById(`${userId} ${label.chatNotificationCount}`).display= '';
}

function selectUserChatBox(element, userId, userName) {
  myFriend.id = userId;
  myFriend.name = userName;

  document.getElementById('form').display = '';
  document.getElementById('messages').display = '';
  document.getElementById(onlineUsers).getElementsByTagName('li').removeClass('active');
  element.addClass('active');
  document.getElementById('notifyTyping').text('');
  document.getElementById('m').value('').focus();

  // resest chat message count to 0
  clearChatNotificationCount(userId);

  // load all chat messages for a selected user
  if(allChatMessages[userId] != undefined) {
    loadChatBox(allChatMessages[userId]);
  } else {
    document.getElementById('messages').innerHTML = ''
  }
}

// EVENT LISTENERS AND EMITTERS

socket.on('newUser', function(newUser) {
  myUser = newUser;
  document.getElementById('myName').innerHTML = myUser.name
});

// Listen to notifyTyping event 

socket.on('notifyTyping', function(sender, recipient){
  if (myFriend.id == sender.id) {
    document.getElementById('notifyTyping').textContent = sender.name + ' is typing...'
  }
  setTimeout(function(){
    document.getElementById('notifyTyping').textContent = ''
  }, 5000)
})

// listen to online users event to update list of online users

socket.on('onlineUsers', function(onlineUsers){
  console.log(onlineUsers)
  let usersList = '';
  if(onlineUsers.length > 1){
    onlineUsers.forEach(function(user){
      if(myUser.id != user.id){
        myFriend.id = user.id;
        myFriend.name = user.name;
        document.getElementById('form').display = '';
      }
    })
  }

  onlineUsers.forEach(function(user){
    if(user.id != myUser.id){
      let activeClass = (user.id == myFriend.id) ? 'active' : '';
      usersList += `
        <li id="${user.id}" class="${activeClass}" onclick="selectUserChatBox(this, ${user.id}, ${user.name})">
          <a href="javascript:void(0)"> ${user.name} </a>
          <label class="chatNotificationCount"></label>
        </li>
      `;
    }
  })
  document.getElementById('onlineUsers').innerHTML = usersList
})

//listen to chatmessage event to receive a message sent by a friend

socket.on('chatMessage', function(message){
  appendChatMessage(message);
});

socket.on('userIsDisconnected', function(userId){
  delete allChatMessages[userId];
  document.getElementById('form').display = 'none'
  document.getElementById('messages').display = 'none';
})
