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

let currentAvatar = "Kuromi"; // 預設頭像

function selectAvatar(avatar, btn) {
  currentAvatar = avatar;

  // 更新 UI 狀態
  document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
  console.log("嘗試送出留言..."); // Debug
  const message = document.getElementById("message").value.trim();
  if (!message) {
    alert("請輸入留言");
    return;
  }

  let name = "匿名";

  if (currentAvatar === "other") {
    name = document.getElementById("customName").value.trim() || "匿名";
  } else {
    // 根據角色設定名字
    const names = { "Kuromi": "酷洛米", "MyMelody": "美樂蒂", "Baku": "巴庫" };
    name = names[currentAvatar] || "匿名";
  }

  const password = document.getElementById("deletePassword").value.trim();

  // 寫入 Firebase
  const newMessageRef = db.ref('messages').push();
  newMessageRef.set({
    name: name,
    avatar: currentAvatar, // 儲存頭像設定
    message: message,
    ip: userIP,
    likes: 0,
    password: password,
    time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
  }).then(() => {
    document.getElementById("message").value = "";
    document.getElementById("deletePassword").value = "";
    // 不用手動 loadMessages，因為有監聽器
  }).catch(err => {
    console.error("留言送出錯誤:", err);
    alert("留言失敗，請檢查 Firebase 設定");
  });
}

function deleteMessage(id) {
  const password = prompt("請輸入刪除密碼：");
  if (!password) return;

  // 先讀取該留言確認密碼
  db.ref('messages/' + id).once('value').then(snapshot => {
    const data = snapshot.val();
    if (!data) {
      alert("留言不存在");
      return;
    }

    if (data.password === password) {
      db.ref('messages/' + id).remove()
        .then(() => alert("刪除成功！"))
        .catch(err => alert("刪除失敗: " + err));
    } else {
      alert("密碼錯誤");
    }
  });
}

function likeMessage(id, currentLikes, btn) {
  // 播放動畫
  showLikeAnimation(btn);

  db.ref('messages/' + id).update({
    likes: (currentLikes || 0) + 1
  });
}

function showLikeAnimation(btn) {
  const rect = btn.getBoundingClientRect();
  const emoji = document.createElement("div");
  emoji.textContent = Math.random() > 0.5 ? "💀" : "💜"; // 隨機出現骷髏或愛心
  emoji.className = "floating-emoji";
  emoji.style.left = rect.left + "px";
  emoji.style.top = rect.top + "px";

  document.body.appendChild(emoji);

  // 動畫結束後移除
  setTimeout(() => emoji.remove(), 1000);
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
      let avatarUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${item.name}`;
      if (item.avatar && item.avatar !== "other") {
        // 使用固定的可愛頭像 Seed
        avatarUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${item.avatar}`;
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

  // 讀取深色模式設定
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    document.getElementById("theme-toggle").textContent = "☀️";
  }
};

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark-mode");

  const isDark = body.classList.contains("dark-mode");
  document.getElementById("theme-toggle").textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}
