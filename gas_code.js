// 這是 Google Apps Script 的後端程式碼
// 請將此程式碼複製並貼上到您的 Google Apps Script 專案中 (替換原本的程式碼)

const SHEET_ID = "YOUR_SHEET_ID"; // 請填入您的 Google Sheet ID
const SHEET_NAME = "工作表1"; // 請確認工作表名稱

function doGet(e) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const messages = rows.map((row, index) => {
        // 假設欄位順序: Time, Name, Message, IP, Likes, Password, ID
        // 如果您的欄位順序不同，請調整這裡的索引
        return {
            time: row[0],
            name: row[1],
            message: row[2],
            ip: row[3],
            likes: row[4],
            // password 不回傳給前端
            id: row[6] || ("msg_" + index) // 如果沒有 ID，暫時用索引當 ID (舊資料相容)
        };
    });

    return ContentService.createTextOutput(JSON.stringify(messages))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    // 處理刪除請求
    if (e.parameter.action === "delete") {
        return handleDelete(e, sheet);
    }

    // 處理新增留言
    const name = e.parameter.name;
    const message = e.parameter.message;
    const ip = e.parameter.ip;
    const likes = 0;
    const password = e.parameter.password || ""; // 儲存密碼
    const id = "msg_" + new Date().getTime(); // 簡單的 ID 生成

    const time = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

    sheet.appendRow([time, name, message, ip, likes, password, id]);

    return ContentService.createTextOutput("Success");
}

function handleDelete(e, sheet) {
    const id = e.parameter.id;
    const password = e.parameter.password;

    if (!id || !password) {
        return jsonResponse({ success: false, error: "缺少 ID 或密碼" });
    }

    const data = sheet.getDataRange().getValues();
    // 尋找對應 ID 的列 (假設 ID 在第 7 欄，索引 6)
    // 注意：第一列是標題，所以從第二列開始找
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
        // 檢查 ID (第 7 欄)
        if (data[i][6] == id) {
            // 檢查密碼 (第 6 欄，索引 5)
            if (data[i][5] == password) {
                rowIndex = i + 1; // Sheet 的列號是 1-based
                break;
            } else {
                return jsonResponse({ success: false, error: "密碼錯誤" });
            }
        }
    }

    if (rowIndex > 0) {
        sheet.deleteRow(rowIndex);
        return jsonResponse({ success: true });
    } else {
        return jsonResponse({ success: false, error: "找不到留言或已刪除" });
    }
}

function jsonResponse(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
