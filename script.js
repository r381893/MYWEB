// Firebase 設定 (請填入您的 Firebase Config)
const firebaseConfig = {
  apiKey: "AIzaSyBSyrBA7OKIc7lC1krGuTFFKY_VRY_pcI0",
  authDomain: "kuromi-board.firebaseapp.com",
  databaseURL: "https://kuromi-board-default-rtdb.firebaseio.com",
  projectId: "kuromi-board",
  storageBucket: "kuromi-board.firebasestorage.app",
  messagingSenderId: "484199377030",
  appId: "1:484199377030:web:dce2b16025118c2d170907",
  measurementId: "G-VX01THZG1Z"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let userIP = "Unknown";
fetch("https://api.ipify.org?format=json")
  .then(res => res.json())
  .then(data => userIP = data.ip)
  .catch(err => console.error("IP取得錯誤:", err));

// Avatar Configuration
const avatars = ['Kuromi', 'MyMelody', 'Pompompurin', 'Cinnamoroll', 'JACK'];
let currentAvatar = 'Kuromi'; // Default

function initAvatarSelector() {
  const container = document.getElementById('avatar-selector');
  if (!container) return;

  container.innerHTML = '';
  avatars.forEach(avatar => {
    const btn = document.createElement('button');
    btn.className = `avatar-option ${avatar === currentAvatar ? 'selected' : ''}`;
    btn.onclick = () => selectAvatar(avatar);

    const img = document.createElement('img');
    img.src = `images/${avatar.toLowerCase()}.png`;
    img.alt = avatar;

    btn.appendChild(img);
    container.appendChild(btn);
  });
}

function selectAvatar(avatar) {
  currentAvatar = avatar;
  // Update UI
  const buttons = document.querySelectorAll('.avatar-option');
  buttons.forEach(btn => {
    if (btn.querySelector('img').alt === avatar) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

function setNickname(name) {
  document.getElementById('nickname').value = name;
}

// 貼圖功能
function addSticker(emoji) {
  const messageInput = document.getElementById("message");
  messageInput.value += emoji;
  messageInput.focus();
}

function submitMessage() {
  const message = document.getElementById("message").value.trim();
  if (!message) {
    alert("請輸入留言");
    return;
  }

  let name = document.getElementById("nickname").value.trim() || "匿名";
  localStorage.setItem("nickname", name !== "匿名" ? name : ""); // 記住暱稱

  // 寫入 Firebase
  const newMessageRef = db.ref('messages').push();
  newMessageRef.set({
    name: name,
    avatar: currentAvatar, // Use selected avatar
    message: message,
    ip: userIP,
    likes: 0,
    time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
  }).then(() => {
    document.getElementById("message").value = "";
  }).catch(err => {
    console.error("留言送出錯誤:", err);
    alert("留言失敗，請檢查 Firebase 設定");
  });
}

// Make functions globally available
window.deleteMessage = function (id) {
  console.log("Attempting to delete message:", id);
  if (confirm("確定要刪除這則留言嗎？")) {
    db.ref('messages/' + id).remove()
      .then(() => {
        console.log("Delete successful");
        alert("刪除成功！");
      })
      .catch(err => {
        console.error("Delete failed:", err);
        alert("刪除失敗: " + err);
      });
  } else {
    console.log("Delete cancelled by user");
  }
};

function likeMessage(id, currentLikes, btn) {
  // 播放動畫
  showLikeAnimation(btn);

  db.ref('messages/' + id).update({
    likes: (currentLikes || 0) + 1
  });
}

function showLikeAnimation(btn) {
  const rect = btn.getBoundingClientRect();

  // Original floating emoji
  const emoji = document.createElement("div");
  emoji.textContent = Math.random() > 0.5 ? "💀" : "💜"; // 隨機出現骷髏或愛心
  emoji.className = "floating-emoji";
  emoji.style.left = rect.left + "px";
  emoji.style.top = rect.top + "px";

  document.body.appendChild(emoji);
  setTimeout(() => emoji.remove(), 1000);

  // Super Like Pop-up (Random chance)
  if (Math.random() > 0.7) {
    const superLike = document.createElement("div");
    const phrases = ["謝謝你! 💜", "Kuromi Love!", "太棒了! 💀", "喜歡! ✨"];
    superLike.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    superLike.className = "super-like";
    // Position slightly above the button
    superLike.style.left = (rect.left + 20) + "px";
    superLike.style.top = (rect.top - 30) + "px";

    document.body.appendChild(superLike);
    setTimeout(() => superLike.remove(), 1500);
  }
}

function toggleReply(id) {
  const replySection = document.getElementById(`reply-${id}`);
  replySection.style.display = replySection.style.display === "none" ? "block" : "none";
}

function submitReply(messageId) {
  const input = document.getElementById(`reply-input-${messageId}`);
  const content = input.value.trim();

  if (!content) return;

  const replyRef = db.ref(`messages/${messageId}/replies`).push();
  replyRef.set({
    content: content,
    time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
  }).then(() => {
    input.value = "";
  });
}

// 監聽資料庫變更 (即時更新)
function listenForMessages() {
  const container = document.getElementById("messages");

  db.ref('messages').on('value', (snapshot) => {
    container.innerHTML = "";
    const data = snapshot.val();
    if (!data) return;

    // 轉成陣列並反轉 (新留言在上面)
    const messages = Object.entries(data).map(([key, value]) => ({
      id: key,
      ...value
    })).reverse();

    messages.forEach(item => {
      // 處理回覆
      let repliesHtml = "";
      let replyCount = 0;
      if (item.replies) {
        const replyList = Object.values(item.replies);
        replyCount = replyList.length;
        replyList.forEach(reply => {
          repliesHtml += `<div class="reply-item">↪ ${reply.content} <small>(${reply.time})</small></div>`;
        });
      }

      // 決定頭像 URL
      let avatarUrl = "";
      if (['JACK', 'Kuromi', 'MyMelody', 'Pompompurin', 'Cinnamoroll'].includes(item.avatar)) {
        avatarUrl = `images/${item.avatar.toLowerCase()}.png`;
      } else if (item.avatar === 'LUZIA') {
        avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=LUZIA`;
      } else {
        avatarUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${item.name}`;
      }

      container.innerHTML += `
        <div class="message">
          <img src="${avatarUrl}" alt="avatar" class="avatar">
          <strong>${item.name}</strong><br>
          <small>${item.time} | ${item.ip}</small>
          <p>${item.message}</p>
          
          <div class="actions">
            <button class="like-btn" onclick="likeMessage('${item.id}', ${item.likes}, this)">❤️ <span>${item.likes || 0}</span></button>
            <button class="reply-btn" onclick="toggleReply('${item.id}')">💬 回覆 ${replyCount > 0 ? `(${replyCount})` : ''}</button>
            <button class="delete-btn" onclick="deleteMessage('${item.id}')">🗑️ 刪除</button>
          </div>

          <div id="reply-${item.id}" class="reply-section" style="display:none;">
            ${repliesHtml}
            <div class="reply-input-area">
              <input type="text" id="reply-input-${item.id}" placeholder="回覆...">
              <button onclick="submitReply('${item.id}')">送出</button>
            </div>
          </div>
        </div>
      `;
    });
  });
}

window.onload = function () {
  listenForMessages();
  initAvatarSelector();

  // 讀取已儲存的暱稱
  const savedName = localStorage.getItem("nickname");
  if (savedName) {
    document.getElementById("nickname").value = savedName;
  }

  // 讀取桌布設定
  const savedWallpaper = localStorage.getItem("wallpaper");
  if (savedWallpaper) {
    document.body.style.backgroundImage = savedWallpaper;
  }
};
const wallpapers = [
  "url('images/background.png')",
  "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)", // Blue gradient
  "linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)", // Sunset gradient
  "linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)", // Purple-Blue
  "linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%)"  // Pink-Blue
];

let currentWallpaperIndex = 0;

function changeWallpaper() {
  currentWallpaperIndex = (currentWallpaperIndex + 1) % wallpapers.length;
  const newWallpaper = wallpapers[currentWallpaperIndex];
  document.body.style.backgroundImage = newWallpaper;
  localStorage.setItem("wallpaper", newWallpaper);
}

// --- New Features Implementation ---

// 1. Falling Animation
function startFallingAnimation() {
  const container = document.getElementById('falling-container');
  if (!container) return;

  const items = ['🌸', '💀', '💜', '🎀', '✨'];

  setInterval(() => {
    const item = document.createElement('div');
    item.textContent = items[Math.floor(Math.random() * items.length)];
    item.className = 'falling-item';

    // Random position and duration
    item.style.left = Math.random() * 100 + 'vw';
    item.style.animationDuration = (Math.random() * 3 + 3) + 's'; // 3-6s
    item.style.fontSize = (Math.random() * 10 + 20) + 'px'; // 20-30px

    container.appendChild(item);

    // Cleanup
    setTimeout(() => item.remove(), 6000);
  }, 500); // Create new item every 500ms
}

// 2. Music Player
function toggleMusic() {
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-btn');

  if (audio.paused) {
    audio.play();
    btn.textContent = '⏸️';
    btn.classList.add('playing');
  } else {
    audio.pause();
    btn.textContent = '🎵';
    btn.classList.remove('playing');
  }
}

// 3. Search Bar
function filterMessages() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const messages = document.querySelectorAll('.message');

  messages.forEach(msg => {
    const text = msg.innerText.toLowerCase();
    if (text.includes(query)) {
      msg.style.display = 'block';
    } else {
      msg.style.display = 'none';
    }
  });
}

// 4. Enhanced Like Animation (Override existing)
// Note: The original showLikeAnimation at line 124 needs to be updated or we can overwrite it here if we are careful. 
// However, since I am appending to the end, I should probably just let the original function exist and modify it or replace it.
// But wait, the original function is defined earlier. 
// To avoid conflict, I will rename this one or just rely on the fact that I can't easily replace the earlier one without a multi-replace.
// Actually, I can just redefine it here and it might work depending on hoisting, but it's better to be clean.
// I will use a different name and update the onclick in HTML? No, that's too much work.
// I will just redefine it. In JS, the last definition wins if they are both function declarations.
// BUT, function declarations are hoisted. If I have two, it might be ambiguous or the last one wins.
// Let's try to replace the ORIGINAL function instead of appending a new one.

// Wait, I see I am replacing from line 237. The original showLikeAnimation is at line 124.
// I will NOT redefine showLikeAnimation here. I will use a separate tool call to update the original one if needed.
// OR, I can just leave the original one as is for now and focus on the other features, then update the like animation separately.
// The user wants "Enhanced Like". The original one is simple.
// I will update the original showLikeAnimation in a separate step to be safe.

// So for this step, I will just add the other features and fix the broken end of file.
// I will also add the startFallingAnimation call to window.onload or just leave the event listener.

// Initialize Falling Animation on Load
window.addEventListener('load', startFallingAnimation);
