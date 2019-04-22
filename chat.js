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
function notifyTyping() { 
  socket.emit('notifyTyping', myUser, myFriend);
}

// function to call when sent a message from chatbox

function createMsgElement(text) {
  
}

function submitFn(e){
  console.log(e.previousSibling.value)
  console.log("message send")
  let message = {};
  let text = e.previousSibling.value;
  console.log(text)
  let messageParentElement = document.getElementById('messages')
  if (text != '') {
   // create the message DOM element
    let msg = document.createElement("LI")
    let msgText = document.createTextNode(text)
    msg.appendChild(msgText)
    msg.classList.add('chatMessageRight')

    message.text = text;
    message.sender = myUser.id;
    message.receiver = myFriend.id;

    messageParentElement.appendChild(msg)

    if(allChatMessages[myFriend.id] != undefined) {
      allChatMessages[myFriend.id].push(message);
    } else {
      allChatMessages[myFriend.id] = new Array(message);
    }
    socket.emit('chatMessage', message);
  }
  e.previousSibling.value = ''

  document.getElementById('m').focus();
  return false;
}

function appendChatMessage(message){
  if (message.receiver == myUser.id && message.sender == myFriend.id) {
    playNewMessageAudio();
    let cssClass = (message.sender == myUser.id) ? 'chatMessageRight' : 'chatMessageLeft';
    let msg = document.createElement("LI")
    let msgText = document.createTextNode(message.text)
    msg.appendChild(msgText)
    msg.classList.add('chatMessageRight')
    document.getElementById('messages').appendChild(msg)
  }
  else {
    playNewMessageNotificationAudio();
    // updateChatNotificationCount(message.sender);
  }

  if (allChatMessages[message.sender] != undefined) {
    allChatMessages[message.sender].push(message);
  } else {
    allChatMessages[message.sender] = new Array(message);
  }
}

// Load all messages for the selected user
function loadChatBox(messages) {
  document.getElementById('messages').innerHTML = '';
  messages.forEach(function(message){
    let msg = document.createElement("LI")
    let msgText = document.createTextNode(message.text)
    msg.appendChild(msgText)
    
    let cssClass = (message.sender == myUser.id) ? 'chatMessageRight' : 'chatMessageLeft';
    msg.classList.add(cssClass)
    document.getElementById('messages').appendChild(msg)
  });
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

// function updateChatNotificationCount(userId) {
//   let count = (chatNotificationCount[userId] == undefined) ? 1 : chatNotificationCount[userId] + 1;
//   chatNotificationCount[userId] = count;
//   let label = document.getElementsByTagName('label')[0]
//   document.getElementById(`${userId} ${label.chatNotificationCount}`).innerHTML = count;
//   document.getElementById(`${userId} ${label.chatNotificationCount}`).display= '';
// }

function selectUserChatBox(e) {
  document.getElementById('form').style.display = 'block'
  document.getElementById('messages').style.display = 'block';
  userId = e.target.id

  myFriend.id = userId;
  myFriend.name = e.target.innerText;

  
  onlineUsers = Array.from(document.getElementById('onlineUsers').getElementsByTagName('li'))
  onlineUsers.forEach((element) =>{
    element.classList.remove('active')
  })
  
  
  if (e.target.classList){
    e.target.classList.add('active');
  }
  else {
    e.target.className += ' ' + 'active';
  }

  // element.classList.add('active');
  document.getElementById('notifyTyping').textContent = '';
  document.getElementById('m').style.display = '';
  document.getElementById('m').focus();

  // resest chat message count to 0
  // clearChatNotificationCount(userId);

  // load all chat messages for a selected user
  if(allChatMessages[userId] != undefined) {
    loadChatBox(allChatMessages[userId]);
  } else {
    document.getElementById('messages').innerHTML = ''
  }
}

// function clearChatNotificationCount(userId) {
//   chatNotificationCount[userId] = 0;
//   let label = document.getElementsByTagName('label')[0]
//   document.getElementById(`${userId} ${label.chatNotificationCount}`).display = 'none'
//   // $('#' + userId + ' label.chatNotificationCount').hide();
// } 

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
        document.getElementById('form').style.display = '';
      }
    })
  }

  onlineUsers.forEach(function(user){
    if(user.id != myUser.id){
      let activeClass = (user.id == myFriend.id) ? 'active' : '';
      usersList += `
        <li id="${user.id}" class="${activeClass}">
          <a href="javascript:void(0)"> ${user.name} </a>
        </li>
      `;
    }
  })
  document.getElementById('onlineUsers').innerHTML = usersList
  document.getElementById('onlineUsers').parentNode.addEventListener('click', selectUserChatBox)
})

//listen to chatmessage event to receive a message sent by a friend

socket.on('chatMessage', function(message){
  appendChatMessage(message);
});

socket.on('userIsDisconnected', function(userId){
  delete allChatMessages[userId];
  document.getElementById('form').style.display = 'none'
  document.getElementById('messages').style.display = 'none';
})
