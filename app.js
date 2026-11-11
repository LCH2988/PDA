const CFG = {
  liffId: 'YOUR_LIFF_ID',
  api: {   // 各系統 GAS Web App 網址
    hub: 'https://script.google.com/macros/s/HUB/exec',
    event: 'https://script.google.com/macros/s/EVENT/exec',
    finance: 'https://script.google.com/macros/s/FIN/exec',
    volunteer: 'https://script.google.com/macros/s/VOL/exec',
    ebook: 'https://script.google.com/macros/s/EBOOK/exec',
    website: 'https://script.google.com/macros/s/WEB/exec'
  }
};

async function startLiff() {
  await liff.init({ liffId: CFG.liffId });
  if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return false; }
  return true;
}

async function api(system, action, payload) {
  const idToken = liff.getIDToken();
  if (!idToken) { liff.login({ redirectUri: location.href }); throw new Error('RELOGIN'); }
  const res = await fetch(CFG.api[system], {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // 避免 CORS 預檢
    body: JSON.stringify({ action: action, payload: payload || {}, idToken: idToken })
  });
  const j = await res.json();
  if (!j.ok) {
    if (j.error === 'NOT_BOUND') { location.href = './register.html'; throw new Error(j.error); }
    if (j.error === 'INVALID_LINE_TOKEN') { liff.logout(); liff.login({ redirectUri: location.href }); throw new Error(j.error); }
    throw new Error(j.error);
  }
  return j.data;
}

const ERR = {
  FORBIDDEN: '您沒有此操作的權限', NOT_BOUND: '尚未綁定', SUSPENDED: '帳號已停權', EVENT_CLOSED: '活動已截止報名',
  ALREADY_REGISTERED: '您已報名或已註冊', FULL: '名額已滿', RATE_LIMIT: '操作過於頻繁,請稍後再試',
  INVALID_PHONE: '手機格式不正確', INVALID_ID: '身分證格式不正確', CONSENT_REQUIRED: '請先勾選同意事項',
  SERVER_ERROR: '系統忙碌,請稍後再試'
};
function errText(e) { return ERR[e.message] || ('發生錯誤:' + e.message); }
// 輸出一律用 textContent / createElement,不要用 innerHTML 拼接使用者資料(防 XSS)
