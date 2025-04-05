const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxsL5tyeeoyvbuYLMb3xGPyGMgOTpqjuktHESDNLQISvGxo1dq1yppRtrhtljcYoWS4/exec';

function submitMessage() {
  const name = document.getElementById("name").value;
  const message = document.getElementById("message").value;

  const formData = new URLSearchParams();
  formData.append("name", name);
  formData.append("message", message);

  fetch(SCRIPT_URL, {
    method: "POST",
    body: formData
  })
    .then(res => res.text())
    .then(data => {
      document.getElementById("result").innerText = "✅ " + data;
      loadMessages();
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
    });
}

// 頁面一進來就載入留言
window.onload = loadMessages;
