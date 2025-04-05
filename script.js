const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxsL5tyeeoyvbuYLMb3xGPyGMgOTpqjuktHESDNLQISvGxo1dq1yppRtrhtljcYoWS4/exec';

function submitMessage() {
  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!message) {
    document.getElementById("result").innerText = "❌ 留言內容不能為空";
    return;
  }

  const formData = new URLSearchParams();
  formData.append("name", name || "匿名");
  formData.append("message", message);

  fetch(SCRIPT_URL, {
    method: "POST",
    body: formData
  })
  .then(res => res.text())
  .then(data => {
    document.getElementById("result").innerText = "✅ " + data;
    document.getElementById("message").value = ""; // 清空留言輸入框
    loadMessages(); // 重新載入留言
  })
  .catch(err => {
    console.error(err);
    document.getElementById("result").innerText = "❌ 發生錯誤";
  });
}

function loadMessages() {
  fetch(SCRIPT_URL)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("messages");
      container.innerHTML = "";
      data.reverse().forEach(entry => {
        const div = document.createElement("div");
        div.innerHTML = `<p><strong>${entry.name}</strong> (${entry.time}):<br>${entry.message}</p><hr>`;
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("載入留言時發生錯誤:", err);
      document.getElementById("messages").innerText = "❌ 無法載入留言";
    });
}

// 頁面載入時自動載入留言
window.onload = loadMessages;
