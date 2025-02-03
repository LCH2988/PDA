// LIFF ID 設定
const LIFF_ID = '2001679903-r5VXNe5g';

// GAS Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzyBxr10uHcQPeADyf6aLLt7OvtjclTaHmGCxC9-n2SyUJYFaK8I8PM_2YmAXim4o9T/exec';

// 初始化 LIFF
async function initializeLiff() {
  try {
    await liff.init({ liffId: LIFF_ID });
    
    // 檢查是否已登入
    if (!liff.isLoggedIn()) {
      showLoginButton();
    } else {
      const token = await liff.getAccessToken();
      const profile = await liff.getProfile();
      checkUserRegistration(profile.userId, token);
    }
  } catch (err) {
    console.error('LIFF 初始化失敗', err);
    showError('LIFF 初始化失敗，請重新整理頁面');
  }
}

// 顯示登入按鈕
function showLoginButton() {
  document.getElementById('loading').classList.add('d-none');
  document.getElementById('content').classList.remove('d-none');
  
  const loginBtn = document.getElementById('liffLoginBtn');
  loginBtn.addEventListener('click', () => {
    liff.login();
  });
}

// 檢查使用者是否已註冊
async function checkUserRegistration(userId, token) {
  try {
    const response = await fetch(`${GAS_URL}?action=checkUser&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.isRegistered) {
      // 已註冊，導向活動列表
      window.location.href = 'events.html';
    } else {
      // 未註冊，導向個人資料頁面
      window.location.href = 'profile.html';
    }
  } catch (err) {
    console.error('檢查使用者註冊狀態失敗', err);
    showError('系統錯誤，請稍後再試');
  }
}

// 顯示錯誤訊息
function showError(message) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="alert alert-danger" role="alert">
      ${message}
    </div>
  `;
  content.classList.remove('d-none');
  document.getElementById('loading').classList.add('d-none');
}

// 頁面載入時初始化 LIFF
document.addEventListener('DOMContentLoaded', initializeLiff);
