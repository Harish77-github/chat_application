
const socket = io();
const clientsTotal = document.getElementById('clients-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const audioTone = new Audio('/audio.mp3');

const userName = prompt("Enter your name", "anonymous") || "anonymous";
nameInput.value = userName;

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

socket.on('connect', () => {
  socket.emit('new-user', {
    name: nameInput.value || "anonymous"
  });
});

nameInput.addEventListener('change', () => {
  socket.emit('name-change', { name: nameInput.value || "anonymous" });
});

socket.on('clients-total', (count) => {
  clientsTotal.textContent = `Total Clients: ${count}`;
});

function sendMessage() {
  const messageText = messageInput.value.trim();
  if (messageText === '') return;

  const data = {
    name: nameInput.value || "anonymous",
    message: messageText,
    dateTime: new Date()
  };

  socket.emit('message', data);
  addMessageToUi(true, data);
  messageInput.value = '';
}

socket.on('chat-message', (data) => {
  audioTone.play().catch(err => console.warn("Audio failed:", err));
  addMessageToUi(false, data);
});

function addMessageToUi(isOwnMessage, data) {
  removeFeedback();
  const element = `
    <li class="${isOwnMessage ? "message-right" : "message-left"}">
      <p class="message">
        ${data.message}
        <span class="timestamp" data-time="${data.dateTime}">
          ${data.name} • ${moment(data.dateTime).fromNow()}
        </span>
      </p>
    </li>
  `;
  messageContainer.innerHTML += element;
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

socket.on('user-joined', (data) => {
  showToast(`👋 ${data.name} joined the chat`);
});

socket.on('user-renamed', (data) => {
  showToast(`✏️ ${data.oldName} changed name to ${data.newName}`);
});

socket.on('user-left', (data) => {
  showToast(`👋 ${data.name} left the chat`);
});

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// messageInput.addEventListener('blur', () => {
//   socket.emit('typing', { name: '' });
//   removeFeedback();
// });

messageInput.addEventListener('keypress', () => {
  socket.emit('typing', {
    name: `${nameInput.value} is typing...`
  });
});

socket.on('typing', (data) => {

  const element = `
    <li class="message-feedback">
      <p class="feedback" id="feedback">${data.name}</p>
    </li>
  `;
  removeFeedback(); // avoid duplicates
  messageContainer.innerHTML += element;
  messageContainer.scrollTop = messageContainer.scrollHeight;
});

function removeFeedback() {

  document.querySelectorAll('.message-feedback').forEach(feedback => {
    feedback.remove();
  });  
}

setInterval(() => {

  const timestamps = document.querySelectorAll('.timestamp');
  timestamps.forEach(el => {
    const dateTime = el.getAttribute('data-time');
    const name = el.textContent.split('•')[0].trim();
    el.textContent = `${name} • ${moment(dateTime).fromNow()}`;
  });
}, 1000);
