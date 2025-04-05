const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxsL5tyeeoyvbuYLMb3xGPyGMgOTpqjuktHESDNLQISvGxo1dq1yppRtrhtljcYoWS4/exec';

function submitMessage() {
  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!message) {
    document.getElementById("result").innerHTML = "<span class='error'>❌ 請輸入留言內容</span>";
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
      document.getElementById("result").innerHTML = "<span class='success'>✅ " + data + "</span>";
      document.getElementById("message").value = "";
      loadMessages();
    })
    .catch(err => {
      console.error("留言錯誤：", err);
      document.getElementById("result").innerHTML = "<span class='error'>❌ 發生錯誤</span>";
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
        div.classList.add("message");
        div.innerHTML = `
          <p>
            <strong>👤 ${entry.name}</strong><br>
            <span style="color:gray">${entry.time}</span><br>
            <span style="white-space: pre-line;">${entry.message}</span>
          </p>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("載入留言失敗：", err);
      document.getElementById("result").innerHTML = "<span class='error'>❌ 無法載入留言</span>";
    });
}

window.onload = loadMessages;

