let userId = null;
let isAdmin = false;

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
    
    // 檢查管理員權限
    await checkAdminPermission(token);
    
    if (!isAdmin) {
      window.location.href = 'events.html';
      return;
    }
    
    // 初始化頁面
    initializeAdminPage(token);
    
    // 設定事件處理
    setupEventHandlers(token);
  } catch (err) {
    console.error('初始化失敗', err);
    showError('載入失敗，請重新整理頁面');
  }
});

// 檢查管理員權限
async function checkAdminPermission(token) {
  try {
    const response = await fetch(`${GAS_URL}?action=checkAdmin&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    isAdmin = data.code === 200 && data.data.isAdmin;
  } catch (err) {
    console.error('檢查權限失敗', err);
    isAdmin = false;
  }
}

// 初始化管理頁面
async function initializeAdminPage(token) {
  // 載入活動列表
  await loadEvents(token);
  
  // 載入活動選項到下拉選單
  await loadEventOptions(token);
  
  // 初始化 Modal
  initializeEventModal();
}

// 載入活動列表
async function loadEvents(token) {
  try {
    const response = await fetch(`${GAS_URL}?action=getAllEvents`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.code === 200) {
      renderEventsTable(data.data.events);
    } else {
      throw new Error(data.error || '載入活動列表失敗');
    }
  } catch (err) {
    showError(err.message);
  }
}

// 渲染活動列表表格
function renderEventsTable(events) {
  const tbody = document.querySelector('#eventsTable tbody');
  tbody.innerHTML = '';
  
  events.forEach(event => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(event.date).toLocaleDateString()}</td>
      <td>${event.title}</td>
      <td>${new Date(event.deadline).toLocaleDateString()}</td>
      <td>${event.currentParticipants}/${event.maxParticipants}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary edit-event" 
                data-event-id="${event.id}">編輯</button>
        <button class="btn btn-sm btn-outline-danger delete-event" 
                data-event-id="${event.id}">刪除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 初始化活動 Modal
function initializeEventModal() {
  const modal = new bootstrap.Modal(document.getElementById('eventModal'));
  
  // 新增自定義欄位按鈕處理
  document.getElementById('addCustomFieldBtn').addEventListener('click', () => {
    addCustomField();
  });
  
  // 儲存按鈕處理
  document.getElementById('saveEventBtn').addEventListener('click', () => {
    saveEvent();
  });
}

// 新增自定義欄位
function addCustomField() {
  const container = document.getElementById('customFieldsContainer');
  const fieldId = `custom-${Date.now()}`;
  
  const fieldHtml = `
    <div class="custom-field mb-2" id="${fieldId}">
      <div class="row">
        <div class="col">
          <input type="text" class="form-control" placeholder="欄位名稱" 
                 name="fieldLabel">
        </div>
        <div class="col">
          <select class="form-select" name="fieldType">
            <option value="text">文字</option>
            <option value="number">數字</option>
            <option value="date">日期</option>
          </select>
        </div>
        <div class="col-auto">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" name="fieldRequired">
            <label class="form-check-label">必填</label>
          </div>
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-outline-danger btn-sm" 
                  onclick="removeCustomField('${fieldId}')">刪除</button>
        </div>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', fieldHtml);
}

// 移除自定義欄位
function removeCustomField(fieldId) {
  document.getElementById(fieldId).remove();
}

// 儲存活動資料
async function saveEvent() {
  const form = document.getElementById('eventForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const eventData = {
    title: document.getElementById('eventTitle').value,
    date: document.getElementById('eventDate').value,
    description: document.getElementById('eventDescription').value,
    content: document.getElementById('eventContent').value,
    maxParticipants: document.getElementById('maxParticipants').value,
    deadline: document.getElementById('deadline').value,
    customFields: getCustomFields()
  };
  
  try {
    const token = await liff.getAccessToken();
    const response = await fetch(`${GAS_URL}?action=saveEvent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    
    const data = await response.json();
    if (data.code === 200) {
      bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
      await loadEvents(token);
      showSuccess('活動儲存成功');
    } else {
      throw new Error(data.error || '儲存失敗');
    }
  } catch (err) {
    showError(err.message);
  }
}

// 獲取自定義欄位資料
function getCustomFields() {
  const fields = [];
  document.querySelectorAll('.custom-field').forEach(field => {
    fields.push({
      label: field.querySelector('[name="fieldLabel"]').value,
      type: field.querySelector('[name="fieldType"]').value,
      required: field.querySelector('[name="fieldRequired"]').checked
    });
  });
  return fields;
}

// 設定事件處理器
function setupEventHandlers(token) {
  // 新增活動按鈕
  document.getElementById('newEventBtn').addEventListener('click', () => {
    document.getElementById('eventForm').reset();
    document.getElementById('customFieldsContainer').innerHTML = '';
    document.getElementById('eventModalLabel').textContent = '新增活動';
    bootstrap.Modal.getInstance(document.getElementById('eventModal')).show();
  });
  
  // 活動選擇下拉選單變更
  document.getElementById('eventSelect').addEventListener('change', async (e) => {
    if (e.target.value) {
      await loadRegistrations(token, e.target.value);
    }
  });
  
  // 報表表單提交
  document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await generateReport(token);
  });
}

// 載入報名資料
async function loadRegistrations(token, eventId) {
  try {
    const response = await fetch(`${GAS_URL}?action=getEventRegistrations&eventId=${eventId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.code === 200) {
      renderRegistrationsTable(data.data.registrations);
    } else {
      throw new Error(data.error || '載入報名資料失敗');
    }
  } catch (err) {
    showError(err.message);
  }
}

// 產生報表
async function generateReport(token) {
  const eventId = document.getElementById('reportEventSelect').value;
  const reportType = document.querySelector('input[name="reportType"]:checked').value;
  
  try {
    const response = await fetch(`${GAS_URL}?action=generateReport&eventId=${eventId}&type=${reportType}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.code === 200) {
      window.open(data.data.reportUrl, '_blank');
    } else {
      throw new Error(data.error || '產生報表失敗');
    }
  } catch (err) {
    showError(err.message);
  }
}

// 顯示成功訊息
function showSuccess(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-success alert-dismissible fade show';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.container').insertAdjacentElement('afterbegin', alert);
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