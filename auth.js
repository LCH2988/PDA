// 全域變數
let userId = null;
let userProfile = null;

// 初始化 LIFF 和身份驗證
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    
    // 檢查是否已登入
    if (!liff.isLoggedIn()) {
      // 未登入時重定向到登入頁面
      window.location.href = 'index.html';
      return;
    }
    
    // 取得使用者資料
    const profile = await liff.getProfile();
    userId = profile.userId;
    userProfile = profile;
    
    // 檢查使用者是否已註冊
    await checkUserRegistration();
    
    // 觸發身份驗證完成事件
    const event = new CustomEvent('authComplete', { 
      detail: { 
        userId: userId,
        profile: userProfile
      } 
    });
    document.dispatchEvent(event);
    
  } catch (err) {
    console.error('身份驗證失敗:', err);
    showError('身份驗證失敗，請重新整理頁面');
  }
});

// 檢查使用者註冊狀態
async function checkUserRegistration() {
  try {
    const token = await liff.getAccessToken();
    const response = await fetch(`${GAS_URL}?action=checkUser&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    // 如果使用者未註冊且當前不在註冊頁面，則導向註冊頁面
    if (!data.data.isRegistered && !window.location.pathname.includes('register.html')) {
      window.location.href = 'register.html';
      return;
    }
    
    return data.data.isRegistered;
  } catch (err) {
    console.error('檢查使用者註冊狀態失敗:', err);
    throw err;
  }
}

// 檢查管理員權限
async function checkAdminPermission() {
  try {
    const token = await liff.getAccessToken();
    const response = await fetch(`${GAS_URL}?action=checkAdmin&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return data.data.isAdmin;
  } catch (err) {
    console.error('檢查管理員權限失敗:', err);
    return false;
  }
}

// 取得使用者資料
async function getUserProfile() {
  try {
    const token = await liff.getAccessToken();
    const response = await fetch(`${GAS_URL}?action=getUserProfile&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.code === 200) {
      return data.data.userData;
    } else {
      throw new Error(data.error || '取得使用者資料失敗');
    }
  } catch (err) {
    console.error('取得使用者資料失敗:', err);
    throw err;
  }
}

// 更新使用者資料
async function updateUserProfile(profileData) {
  try {
    const token = await liff.getAccessToken();
    const response = await fetch(`${GAS_URL}?action=updateProfile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        ...profileData
      })
    });
    
    const data = await response.json();
    if (data.code === 200) {
      return true;
    } else {
      throw new Error(data.error || '更新使用者資料失敗');
    }
  } catch (err) {
    console.error('更新使用者資料失敗:', err);
    throw err;
  }
}

// 登出
function logout() {
  if (liff.isLoggedIn()) {
    liff.logout();
    window.location.href = 'index.html';
  }
}

// 顯示錯誤訊息
function showError(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger alert-dismissible fade show';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.container').insertAdjacentElement('afterbegin', alert);
}

// 取得 LINE Access Token
async function getLineToken() {
  try {
    return await liff.getAccessToken();
  } catch (err) {
    console.error('取得 LINE Token 失敗:', err);
    return null;
  }
}

// 導出常用函數
export {
  userId,
  userProfile,
  checkAdminPermission,
  getUserProfile,
  updateUserProfile,
  logout,
  getLineToken
};
