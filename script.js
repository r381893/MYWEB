function submitData() {
  const name = document.getElementById("name").value;
  const message = document.getElementById("message").value;

  // 以表單格式 (x-www-form-urlencoded) 傳給後端，避免 CORS 預檢
  const formData = new URLSearchParams();
  formData.append("name", name);
  formData.append("message", message);

  fetch("https://script.google.com/macros/s/AKfycbxsL5tyeeoyvbuYLMb3xGPyGMgOTpqjuktHESDNLQISvGxo1dq1yppRtrhtljcYoWS4/exec", {
    method: "POST",
    body: formData
    // 不要再加任何 headers，如 'Content-Type': 'application/json'，以免觸發 CORS 預檢
  })
    .then(response => response.text())
    .then(data => {
      console.log("後端回應：", data);
      document.getElementById("result").innerText = "✅ 成功送出：" + data;
    })
    .catch(error => {
      console.error("錯誤：", error);
      document.getElementById("result").innerText = "❌ 發生錯誤";
    });
}
