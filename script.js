// 請將下面這個網址替換成你自己的 Apps Script 部署網址
const scriptURL = "https://script.google.com/macros/s/AKfycbwk1SjKyzHJIP6-ZFtokhqOH1bmzHduffQuhrkaL1jYS3swQ7ixBWtxEsi89-fABNSV/exec";

let userIP = "";
fetch("https://api.ipify.org?format=json")
  .then(res => res.json())
  .then(data => userIP = data.ip);

document.querySelectorAll('input[name="username"]').forEach(radio => {
  radio.addEventListener('change', function() {
    document.getElementById("customName").style.display = (this.value === "other") ? "block" : "none";
  });
});

function addSticker(sticker) {
  const messageArea = document.getElementById("message");
  messageArea.value += sticker;
}

function submitMessage() {
  const message = document.getElementById("message").value.trim();
  if (!message) return alert("請輸入留言");

  const selected = document.querySelector('input[name="username"]:checked');
  let name = "匿名";
  if (selected) {
    name = selected.value === "other" ? (document.getElementById("customName").value.trim() || "匿名") : selected.value;
  }

  const formData = new URLSearchParams();
  formData.append("name", name);
  formData.append("message", message);
  formData.append("ip", userIP);
  formData.append("likes", 0);

  fetch(scriptURL, { method: "POST", body: formData })
    .then(() => {
      document.getElementById("message").value = "";
      loadMessages();
    })
    .catch(err => console.error("錯誤:", err));
}

function loadMessages() {
  fetch(scriptURL)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("messages");
      container.innerHTML = "";
      data.reverse().forEach(item => {
        container.innerHTML += `
          <div class="message">
            <img src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=${item.name}" class="avatar">
            <strong>${item.name}</strong><br>
            <small>${item.time} | ${item.ip}</small>
            <p>${item.message}</p>
            <button class="like-btn" onclick="likeMessage(this)">❤️ <span>${item.likes || 0}</span></button>
          </div>
        `;
      });
    })
    .catch(err => console.error("讀取留言發生錯誤:", err));
}

function likeMessage(btn) {
  const span = btn.querySelector("span");
  let count = parseInt(span.textContent, 10) + 1;
  span.textContent = count;
}

window.onload = loadMessages;
