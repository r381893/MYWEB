const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxsL5tyeeoyvbuYLMb3xGPyGMgOTpqjuktHESDNLQISvGxo1dq1yppRtrhtljcYoWS4/exec';

// 提交留言
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
      loadMessages(); // 重新載入留言
    })
    .catch(err => {
      console.error("送出留言錯誤：", err);
      document.getElementById("result").innerText = "❌ 發生錯誤";
    });
}

// 載入留言
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
      console.error("載入留言時發生錯誤：", err);
      document.getElementById("result").innerHTML = "❌ <span style='color:red;'>無法載入留言</span>";
    });
}

window.onload = loadMessages;
