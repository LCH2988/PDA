let userId = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }
    
    const profile = await liff.getProfile();
    userId = profile.userId;
    const token = await liff.getAccessToken();
    
    // 載入現有資料
    await loadUserProfile(token);
    
    // 設定表單提交處理
    setupFormSubmit(token);
  } catch (err) {
    console.error('初始化失敗', err);
    showError('載入失敗，請重新整理頁面');
  }
});

// 載入使用者資料
async function loadUserProfile(token) {
  try {
    const response = await fetch(`${GAS_URL}?action=getUserProfile&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.code === 200 && data.data.userData) {
      fillFormData(data.data.userData);
    }
  } catch (err) {
    showError('載入個人資料失敗');
  }
}

// 填充表單資料
function fillFormData(userData) {
  document.getElementById('name').value = userData.name || '';
  if (userData.diet) {
    document.querySelector(`input[name="diet"][value="${userData.diet}"]`).checked = true;
  }
  document.getElementById('phone').value = userData.phone || '';
  document.getElementById('birthday').value = userData.birthday || '';
  document.getElementById('idNumber').value = userData.idNumber || '';
}

// 設定表單提交
function setupFormSubmit(token) {
  const form = document.getElementById('profileForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      userId: userId,
      name: document.getElementById('name').value,
      diet: document.querySelector('input[name="diet"]:checked').value,
      phone: document.getElementById('phone').value,
      birthday: document.getElementById('birthday').value,
      idNumber: document.getElementById('idNumber').value
    };
    
    try {
      const response = await fetch(`${GAS_URL}?action=updateProfile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.code === 200) {
        showSuccess('資料更新成功');
        setTimeout(() => {
          window.location.href = 'events.html';
        }, 2000);
      } else {
        throw new Error(data.error || '更新失敗');
      }
    } catch (err) {
      showError(err.message);
    }
  });
}

// 顯示成功訊息
function showSuccess(message) {
  const form = document.getElementById('profileForm');
  const alert = document.createElement('div');
  alert.className = 'alert alert-success mt-3';
  alert.textContent = message;
  form.appendChild(alert);
}

// 顯示錯誤訊息
function showError(message) {
  const form = document.getElementById('profileForm');
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger mt-3';
  alert.textContent = message;
  form.appendChild(alert);
}