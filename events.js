// 活動列表處理
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }
    
    const token = await liff.getAccessToken();
    await loadEvents(token);
  } catch (err) {
    console.error('初始化失敗', err);
    showError('載入失敗，請重新整理頁面');
  }
});

// 載入活動列表
async function loadEvents(token) {
  try {
    const response = await fetch(`${GAS_URL}?action=getEvents`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.code === 200) {
      renderEvents(data.data.events);
    } else {
      throw new Error(data.error || '載入活動失敗');
    }
  } catch (err) {
    showError(err.message);
  }
}

// 渲染活動卡片
function renderEvents(events) {
  const container = document.getElementById('eventsList');
  const template = document.getElementById('eventCardTemplate');
  
  events.forEach(event => {
    const clone = template.content.cloneNode(true);
    
    // 填充活動資料
    clone.querySelector('.card-title').textContent = event.title;
    clone.querySelector('.card-subtitle').textContent = new Date(event.date).toLocaleDateString();
    clone.querySelector('.description').textContent = event.description;
    clone.querySelector('.deadline').textContent = new Date(event.deadline).toLocaleDateString();
    clone.querySelector('.participants').textContent = 
      `${event.currentParticipants}/${event.maxParticipants}`;
    
    // 設定報名按鈕
    const registerBtn = clone.querySelector('.register-btn');
    if (event.currentParticipants >= event.maxParticipants) {
      registerBtn.disabled = true;
      registerBtn.textContent = '已額滿';
    } else if (new Date(event.deadline) < new Date()) {
      registerBtn.disabled = true;
      registerBtn.textContent = '已截止';
    } else {
      registerBtn.addEventListener('click', () => {
        window.location.href = `registration.html?eventId=${event.id}`;
      });
    }
    
    container.appendChild(clone);
  });
}

// 顯示錯誤訊息
function showError(message) {
  const container = document.getElementById('eventsList');
  container.innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger" role="alert">
        ${message}
      </div>
    </div>
  `;
}