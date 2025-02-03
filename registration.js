let userId = null;
let eventId = null;

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
    
    // 獲取活動 ID
    const urlParams = new URLSearchParams(window.location.search);
    eventId = urlParams.get('eventId');
    
    if (!eventId) {
      window.location.href = 'events.html';
      return;
    }
    
    // 載入活動和使用者資料
    await Promise.all([
      loadEventDetails(token),
      loadUserProfile(token)
    ]);
    
    // 設定表單提交處理
    setupFormSubmit(token);
  } catch (err) {
    console.error('初始化失敗', err);
    showError('載入失敗，請重新整理頁面');
  }
});

// 載入活動詳細資料
async function loadEventDetails(token) {
  try {
    const response = await fetch(`${GAS_URL}?action=getEventDetails&eventId=${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.code === 200) {
      renderEventDetails(data.data.event);
    } else {
      throw new Error(data.error || '載入活動資料失敗');
    }
  } catch (err) {
    showError(err.message);
  }
}

// 渲染活動詳細資料
function renderEventDetails(event) {
  document.getElementById('eventTitle').textContent = event.title;
  
  const detailsContainer = document.getElementById('eventDetails');
  detailsContainer.innerHTML = `
    <p><strong>活動日期：</strong>${new Date(event.date).toLocaleDateString()}</p>
    <p><strong>活動說明：</strong>${event.description}</p>
    <p><strong>報名截止：</strong>${new Date(event.deadline).toLocaleDateString()}</p>
    <p><strong>剩餘名額：</strong>${event.maxParticipants - event.currentParticipants}</p>
  `;
  
  // 如果有自定義欄位，動態產生表單
  if (event.customFields) {
    const customFieldsContainer = document.getElementById('customFields');
    event.customFields.forEach(field => {
      const fieldHtml = `
        <div class="mb-3">
          <label for="${field.id}" class="form-label">${field.label}</label>
          <input type="${field.type}" class="form-control" id="${field.id}" 
                 ${field.required ? 'required' : ''}>
        </div>
      `;
      customFieldsContainer.insertAdjacentHTML('beforeend', fieldHtml);
    });
  }
}

// 載入使用者資料
async function loadUserProfile(token) {
  try {
    const response = await fetch(`${GAS_URL}?action=getUserProfile&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.code === 200) {
      fillUserData(data.data.userData);
    } else {
      throw new Error(data.error || '載入使用者資料失敗');
    }
  } catch (err) {
    showError(err.message);
  }
}

// 填充使用者資料
function fillUserData(userData) {
  document.getElementById('name').value = userData.name;
  document.getElementById('diet').value = userData.diet;
}

// 設定表單提交
function setupFormSubmit(token) {
  const form = document.getElementById('registrationForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      eventId: eventId,
      userId: userId,
      notes: document.getElementById('notes').value,
      customFields: {}
    };
    
    // 收集自定義欄位資料
    const customFields = document.getElementById('customFields').querySelectorAll('input');
    customFields.forEach(field => {
      formData.customFields[field.id] = field.value;
    });
    
    try {
      const response = await fetch(`${GAS_URL}?action=registerEvent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.code === 200) {
        showSuccess('報名成功！');
        setTimeout(() => {
          window.location.href = 'my-events.html';
        }, 2000);
      } else {
        throw new Error(data.error || '報名失敗');
      }
    } catch (err) {
      showError(err.message);
    }
  });
}

// 顯示成功訊息
function showSuccess(message) {
  const form = document.getElementById('registrationForm');
  const alert = document.createElement('div');
  alert.className = 'alert alert-success mt-3';
  alert.textContent = message;
  form.appendChild(alert);
}

// 顯示錯誤訊息
function showError(message) {
  const form = document.getElementById('registrationForm');
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger mt-3';
  alert.textContent = message;
  form.appendChild(alert);
}