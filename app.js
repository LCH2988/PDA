// ==================== 全域變數 ====================
let currentUser = null;
let currentPage = 'home';
let isDarkTheme = false;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // 檢查登入狀態
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainApp();
  } else {
    showLoginPage();
  }
  
  // 載入主題設定
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDarkTheme = true;
    document.body.classList.add('dark-theme');
  }
  
  // 註冊 Service Worker (PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('Service Worker 註冊失敗:', err);
    });
  }
}

// ==================== API 呼叫 ====================
async function callAPI(action, payload = {}) {
  showLoading();
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    
    const data = await response.json();
    hideLoading();
    return data;
  } catch (error) {
    hideLoading();
    console.error('API 呼叫錯誤:', error);
    showToast('網路錯誤，請稍後再試', 'error');
    return { success: false, error: error.message };
  }
}

// ==================== 載入動畫 ====================
function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// ==================== Toast 通知 ====================
function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  toast.innerHTML = `
    <i class="fas ${icons[type]}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==================== 登入頁面 ====================
function showLoginPage() {
  document.getElementById('navbarMount').innerHTML = '';
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div class="card" style="max-width: 420px; width: 100%; margin: 1rem;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <i class="fas fa-brain" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 0.5rem;"></i>
          <h2 style="margin: 0.5rem 0;">腦帕金森病友會</h2>
          <p style="color: var(--text-secondary); margin: 0;">管理系統</p>
        </div>
        
        <div id="loginFormContainer">
          <form id="loginForm" onsubmit="handleLogin(event)">
            <div class="form-group">
              <label>帳號</label>
              <input type="text" name="username" class="form-control" placeholder="請輸入帳號" required>
            </div>
            
            <div class="form-group">
              <label>密碼</label>
              <input type="password" name="password" class="form-control" placeholder="請輸入密碼" required>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" name="remember">
                <span style="font-size: 0.9rem;">記住我</span>
              </label>
              <a href="#" onclick="showForgotPassword(); return false;" style="font-size: 0.9rem; color: var(--primary-color);">忘記密碼？</a>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block btn-lg">
              <i class="fas fa-sign-in-alt"></i> 登入
            </button>
          </form>
          
          <div style="text-align: center; margin-top: 1rem;">
            <span style="color: var(--text-secondary);">還沒有帳號？</span>
            <a href="#" onclick="showRegisterForm(); return false;" style="color: var(--primary-color); font-weight: 500;">立即註冊</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const result = await callAPI('login', {
    username: formData.get('username'),
    password: formData.get('password')
  });
  
  if (result.success) {
    currentUser = result.user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showToast('登入成功！', 'success');
    showMainApp();
  } else {
    showToast(result.error || '登入失敗', 'error');
  }
}

function showRegisterForm() {
  document.getElementById('loginFormContainer').innerHTML = `
    <form id="registerForm" onsubmit="handleRegister(event)">
      <div class="form-row">
        <div class="form-group">
          <label>姓名 *</label>
          <input type="text" name="name" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label>性別 *</label>
          <select name="gender" class="form-control" required>
            <option value="">請選擇</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>出生日期</label>
          <input type="date" name="birthDate" class="form-control">
        </div>
        
        <div class="form-group">
          <label>電話 *</label>
          <input type="tel" name="phone" class="form-control" required>
        </div>
      </div>
      
      <div class="form-group">
        <label>電子郵件 *</label>
        <input type="email" name="email" class="form-control" required>
      </div>
      
      <div class="form-group">
        <label>地址</label>
        <input type="text" name="address" class="form-control">
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>帳號 *</label>
          <input type="text" name="username" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label>密碼 *</label>
          <input type="password" name="password" class="form-control" required>
        </div>
      </div>
      
      <button type="submit" class="btn btn-primary btn-block btn-lg">
        <i class="fas fa-user-plus"></i> 註冊
      </button>
      
      <div style="text-align: center; margin-top: 1rem;">
        <a href="#" onclick="showLoginPage(); return false;" style="color: var(--primary-color);">返回登入</a>
      </div>
    </form>
  `;
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const payload = {
    name: formData.get('name'),
    gender: formData.get('gender'),
    birthDate: formData.get('birthDate'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    username: formData.get('username'),
    password: formData.get('password')
  };
  
  const result = await callAPI('register', payload);
  
  if (result.success) {
    showToast('註冊成功！請登入', 'success');
    showLoginPage();
  } else {
    showToast(result.error || '註冊失敗', 'error');
  }
}

function showForgotPassword() {
  document.getElementById('loginFormContainer').innerHTML = `
    <form id="forgotPasswordForm" onsubmit="handleForgotPassword(event)">
      <div class="form-group">
        <label>電子郵件</label>
        <input type="email" name="email" class="form-control" placeholder="請輸入註冊時的電子郵件" required>
      </div>
      
      <button type="submit" class="btn btn-primary btn-block">
        <i class="fas fa-paper-plane"></i> 發送重設連結
      </button>
      
      <div style="text-align: center; margin-top: 1rem;">
        <a href="#" onclick="showLoginPage(); return false;" style="color: var(--primary-color);">返回登入</a>
      </div>
    </form>
  `;
}

async function handleForgotPassword(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const result = await callAPI('forgotPassword', {
    email: formData.get('email')
  });
  
  if (result.success) {
    showToast(result.message, 'success');
    showLoginPage();
  } else {
    showToast(result.error || '發送失敗', 'error');
  }
}

// ==================== 主應用程式 ====================
function showMainApp() {
  renderNavbar();
  navigateTo('home');
}

function renderNavbar() {
  const isAdmin = currentUser.role === 'admin';
  
  document.getElementById('navbarMount').innerHTML = `
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <i class="fas fa-brain"></i>
          <span>腦帕金森病友會</span>
        </div>
        
        <div class="navbar-menu">
          <a href="#" class="nav-link ${currentPage === 'home' ? 'active' : ''}" onclick="navigateTo('home'); return false;">
            <i class="fas fa-home"></i> 首頁
          </a>
          <a href="#" class="nav-link ${currentPage === 'activities' ? 'active' : ''}" onclick="navigateTo('activities'); return false;">
            <i class="fas fa-calendar-alt"></i> 活動
          </a>
          ${isAdmin ? `
            <a href="#" class="nav-link ${currentPage === 'members' ? 'active' : ''}" onclick="navigateTo('members'); return false;">
              <i class="fas fa-users"></i> 會員
            </a>
            <a href="#" class="nav-link ${currentPage === 'dashboard' ? 'active' : ''}" onclick="navigateTo('dashboard'); return false;">
              <i class="fas fa-chart-line"></i> 儀表板
            </a>
            <a href="#" class="nav-link ${currentPage === 'reports' ? 'active' : ''}" onclick="navigateTo('reports'); return false;">
              <i class="fas fa-file-alt"></i> 報表
            </a>
          ` : ''}
          
          <div class="notification-icon" onclick="toggleNotifications()">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
          </div>
          
          <div class="user-menu">
            <div class="user-avatar" onclick="toggleUserMenu()">
              ${currentUser.name.charAt(0)}
            </div>
            <div class="dropdown-menu" id="userDropdown">
              <a href="#" onclick="navigateTo('profile'); return false;">
                <i class="fas fa-user"></i> 個人資料
              </a>
              <a href="#" onclick="navigateTo('settings'); return false;">
                <i class="fas fa-cog"></i> 設定
              </a>
              <a href="#" onclick="handleLogout(); return false;">
                <i class="fas fa-sign-out-alt"></i> 登出
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
  
  loadNotifications();
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.toggle('show');
}

function toggleNotifications() {
  navigateTo('notifications');
}

async function loadNotifications() {
  const result = await callAPI('getNotifications', { memberId: currentUser.id });
  if (result.success) {
    const unreadCount = result.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  showToast('已登出', 'info');
  showLoginPage();
}

// ==================== 路由導航 ====================
function navigateTo(page) {
  currentPage = page;
  renderNavbar();
  
  const pages = {
    home: renderHomePage,
    activities: renderActivitiesPage,
    members: renderMembersPage,
    dashboard: renderDashboardPage,
    reports: renderReportsPage,
    profile: renderProfilePage,
    settings: renderSettingsPage,
    notifications: renderNotificationsPage
  };
  
  if (pages[page]) {
    pages[page]();
  } else {
    document.getElementById('app').innerHTML = '<div class="container"><h2>頁面不存在</h2></div>';
  }
  
  window.scrollTo(0, 0);
}

// ==================== 首頁 ====================
async function renderHomePage() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1><i class="fas fa-home"></i> 首頁</h1>
      </div>
      
      <div class="kpi-grid" id="homeStats">
        <div class="card"><p>載入中...</p></div>
      </div>
      
      <div class="grid grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-calendar-check"></i> 最新活動</h3>
          </div>
          <div id="latestActivities">
            <p>載入中...</p>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-bullhorn"></i> 最新公告</h3>
          </div>
          <div id="latestNews">
            <p>載入中...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  await loadHomeData();
}

async function loadHomeData() {
  // 載入統計資料
  const statsResult = await callAPI('getHomeStats', { memberId: currentUser.id });
  if (statsResult.success) {
    const { stats } = statsResult;
    document.getElementById('homeStats').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.upcomingActivities}</h3>
          <p>即將舉辦的活動</p>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.myRegistrations}</h3>
          <p>我的報名</p>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <i class="fas fa-star"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.myPoints}</h3>
          <p>我的積分</p>
        </div>
      </div>
    `;
  }
  
  // 載入最新活動
  const activitiesResult = await callAPI('getLatestActivities', { limit: 6 });
  if (activitiesResult.success) {
    const activities = activitiesResult.activities;
    if (activities.length === 0) {
      document.getElementById('latestActivities').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <p>目前沒有活動</p>
        </div>
      `;
    } else {
      document.getElementById('latestActivities').innerHTML = activities.map(activity => `
        <div class="activity-record-item" onclick="showActivityDetail('${activity['活動ID']}')">
          <div class="activity-record-icon" style="background: var(--primary-color);">
            <i class="fas fa-calendar"></i>
          </div>
          <div style="flex: 1;">
            <h4 style="margin: 0 0 0.2rem 0;">${activity['活動名稱']}</h4>
            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
              <i class="fas fa-clock"></i> ${formatDate(activity['開始時間'])}
            </p>
          </div>
          <span class="status-badge ${getActivityStatus(activity['開始時間'], activity['結束時間'])}">${getActivityStatusText(activity['開始時間'], activity['結束時間'])}</span>
        </div>
      `).join('');
    }
  }
  
  // 載入最新公告
  const newsResult = await callAPI('getLatestNews', { limit: 5 });
  if (newsResult.success) {
    const news = newsResult.news;
    if (news.length === 0) {
      document.getElementById('latestNews').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-newspaper"></i>
          <p>目前沒有公告</p>
        </div>
      `;
    } else {
      document.getElementById('latestNews').innerHTML = news.map(item => `
        <div style="padding: 0.8rem 0; border-bottom: 1px solid var(--border-color);">
          <h4 style="margin: 0 0 0.3rem 0;">${item['標題']}</h4>
          <p style="margin: 0 0 0.3rem 0; color: var(--text-secondary); font-size: 0.9rem;">${item['內容']}</p>
          <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">
            <i class="fas fa-clock"></i> ${formatDate(item['發布時間'])}
          </p>
        </div>
      `).join('');
    }
  }
}

// ==================== 活動頁面 ====================
async function renderActivitiesPage() {
  const isAdmin = currentUser.role === 'admin';
  
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1><i class="fas fa-calendar-alt"></i> 活動管理</h1>
        ${isAdmin ? '<button class="btn btn-primary" onclick="showCreateActivityModal()"><i class="fas fa-plus"></i> 新增活動</button>' : ''}
      </div>
      
      <div class="card mb-2">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-sm ${currentActivityFilter === 'all' ? 'btn-primary' : ''}" onclick="filterActivities('all')">全部</button>
          <button class="btn btn-sm ${currentActivityFilter === 'upcoming' ? 'btn-primary' : ''}" onclick="filterActivities('upcoming')">即將舉辦</button>
          <button class="btn btn-sm ${currentActivityFilter === 'ongoing' ? 'btn-primary' : ''}" onclick="filterActivities('ongoing')">進行中</button>
          <button class="btn btn-sm ${currentActivityFilter === 'completed' ? 'btn-primary' : ''}" onclick="filterActivities('completed')">已結束</button>
        </div>
      </div>
      
      <div class="grid grid-3" id="activitiesList">
        <div class="card"><p>載入中...</p></div>
      </div>
    </div>
  `;
  
  await loadActivities();
}

let currentActivityFilter = 'all';

async function filterActivities(filter) {
  currentActivityFilter = filter;
  await renderActivitiesPage();
}

async function loadActivities() {
  const result = await callAPI('getActivities', {});
  if (result.success) {
    let activities = result.activities;
    
    // 篩選活動
    const now = new Date();
    if (currentActivityFilter === 'upcoming') {
      activities = activities.filter(a => new Date(a['開始時間']) > now);
    } else if (currentActivityFilter === 'ongoing') {
      activities = activities.filter(a => {
        const start = new Date(a['開始時間']);
        const end = new Date(a['結束時間']);
        return start <= now && now <= end;
      });
    } else if (currentActivityFilter === 'completed') {
      activities = activities.filter(a => new Date(a['結束時間']) < now);
    }
    
    if (activities.length === 0) {
      document.getElementById('activitiesList').innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-calendar-times"></i>
          <p>目前沒有活動</p>
        </div>
      `;
    } else {
      document.getElementById('activitiesList').innerHTML = activities.map(activity => {
        const progress = (activity['已報名人數'] / activity['人數上限']) * 100;
        const status = getActivityStatus(activity['開始時間'], activity['結束時間']);
        const statusText = getActivityStatusText(activity['開始時間'], activity['結束時間']);
        
        return `
          <div class="activity-card" onclick="showActivityDetail('${activity['活動ID']}')">
            <div class="activity-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="activity-content">
              <span class="activity-category">${activity['活動類型']}</span>
              <h3 class="activity-title">${activity['活動名稱']}</h3>
              <div class="activity-meta">
                <span><i class="fas fa-clock"></i> ${formatDate(activity['開始時間'])}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${activity['活動地點']}</span>
                <span><i class="fas fa-users"></i> ${activity['已報名人數']} / ${activity['人數上限']}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <div class="activity-footer">
                <span class="status-badge ${status}">${statusText}</span>
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); registerForActivity('${activity['活動ID']}', '${activity['活動名稱']}')">
                  <i class="fas fa-hand-paper"></i> 報名
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function showCreateActivityModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="close-modal" onclick="this.closest('.modal').remove()">
        <i class="fas fa-times"></i>
      </div>
      <div class="modal-header">
        <h2><i class="fas fa-plus-circle"></i> 新增活動</h2>
      </div>
      <div class="modal-body">
        <form id="createActivityForm" onsubmit="handleCreateActivity(event)">
          <div class="form-group">
            <label>活動名稱 *</label>
            <input type="text" name="name" class="form-control" required>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>活動類型 *</label>
              <select name="type" class="form-control" required>
                <option value="">請選擇</option>
                <option value="健康講座">健康講座</option>
                <option value="復健課程">復健課程</option>
                <option value="社交活動">社交活動</option>
                <option value="志工服務">志工服務</option>
                <option value="其他">其他</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>活動地點 *</label>
              <input type="text" name="location" class="form-control" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>開始時間 *</label>
              <input type="datetime-local" name="startTime" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label>結束時間 *</label>
              <input type="datetime-local" name="endTime" class="form-control" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>人數上限 *</label>
              <input type="number" name="maxParticipants" class="form-control" min="1" required>
            </div>
            
            <div class="form-group">
              <label>負責人</label>
              <input type="text" name="organizer" class="form-control">
            </div>
          </div>
          
          <div class="form-group">
            <label>聯絡電話</label>
            <input type="tel" name="contactPhone" class="form-control">
          </div>
          
          <div class="form-group">
            <label>活動說明</label>
            <textarea name="description" class="form-control" rows="4"></textarea>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn" onclick="this.closest('.modal').remove()">取消</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> 建立活動
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function handleCreateActivity(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const payload = {
    name: formData.get('name'),
    type: formData.get('type'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    location: formData.get('location'),
    maxParticipants: parseInt(formData.get('maxParticipants')),
    organizer: formData.get('organizer'),
    contactPhone: formData.get('contactPhone'),
    description: formData.get('description')
  };
  
  const result = await callAPI('createActivity', payload);
  
  if (result.success) {
    showToast('活動建立成功！', 'success');
    form.closest('.modal').remove();
    await loadActivities();
  } else {
    showToast(result.error || '建立失敗', 'error');
  }
}

async function registerForActivity(activityId, activityName) {
  const result = await callAPI('registerActivity', {
    activityId,
    memberId: currentUser.id,
    memberName: currentUser.name
  });
  
  if (result.success) {
    showToast('報名成功！', 'success');
    await loadActivities();
  } else {
    showToast(result.error || '報名失敗', 'error');
  }
}

function showActivityDetail(activityId) {
  // 顯示活動詳情的 Modal
  showToast('活動詳情功能開發中', 'info');
}

// ==================== 會員頁面 ====================
async function renderMembersPage() {
  if (currentUser.role !== 'admin') {
    document.getElementById('app').innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-lock"></i>
          <h2>權限不足</h2>
          <p>您沒有權限訪問此頁面</p>
        </div>
      </div>
    `;
    return;
  }
  
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1><i class="fas fa-users"></i> 會員管理</h1>
        <button class="btn btn-primary" onclick="showAddMemberModal()">
          <i class="fas fa-user-plus"></i> 新增會員
        </button>
      </div>
      
      <div class="kpi-grid" id="memberStats">
        <div class="card"><p>載入中...</p></div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>會員ID</th>
              <th>姓名</th>
              <th>性別</th>
              <th>電話</th>
              <th>電子郵件</th>
              <th>加入日期</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="membersTableBody">
            <tr><td colspan="8" style="text-align: center;">載入中...</td></tr>
          </tbody>
        </table>
      </div>
      
      <div class="pagination" id="membersPagination"></div>
    </div>
  `;
  
  await loadMembers();
}

let currentMembersPage = 1;

async function loadMembers(page = 1) {
  currentMembersPage = page;
  const result = await callAPI('getMembers', { page, limit: 20 });
  
  if (result.success) {
    const { members, stats, pagination } = result;
    
    // 更新統計
    document.getElementById('memberStats').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <i class="fas fa-users"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.total}</h3>
          <p>總會員數</p>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <i class="fas fa-user-check"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.active}</h3>
          <p>活躍會員</p>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <i class="fas fa-user-plus"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.newThisMonth}</h3>
          <p>本月新增</p>
        </div>
      </div>
    `;
    
    // 更新表格
    if (members.length === 0) {
      document.getElementById('membersTableBody').innerHTML = `
        <tr><td colspan="8" style="text-align: center;">目前沒有會員資料</td></tr>
      `;
    } else {
      document.getElementById('membersTableBody').innerHTML = members.map(member => `
        <tr>
          <td>${member['會員ID']}</td>
          <td>${member['姓名']}</td>
          <td>${member['性別']}</td>
          <td>${member['電話']}</td>
          <td>${member['電子郵件']}</td>
          <td>${formatDate(member['加入日期'])}</td>
          <td><span class="status-badge ${member['狀態'] === '啟用' ? 'active' : 'inactive'}">${member['狀態']}</span></td>
          <td>
            <button class="btn btn-sm" onclick="showMemberDetail('${member['會員ID']}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm" onclick="showEditMemberModal('${member['會員ID']}')">
              <i class="fas fa-edit"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
    
    // 更新分頁
    renderPagination('membersPagination', pagination, loadMembers);
  }
}

function showAddMemberModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="close-modal" onclick="this.closest('.modal').remove()">
        <i class="fas fa-times"></i>
      </div>
      <div class="modal-header">
        <h2><i class="fas fa-user-plus"></i> 新增會員</h2>
      </div>
      <div class="modal-body">
        <form id="addMemberForm" onsubmit="handleAddMember(event)">
          <div class="form-row">
            <div class="form-group">
              <label>姓名 *</label>
              <input type="text" name="name" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label>性別 *</label>
              <select name="gender" class="form-control" required>
                <option value="">請選擇</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>電話 *</label>
              <input type="tel" name="phone" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label>出生日期</label>
              <input type="date" name="birthDate" class="form-control">
            </div>
          </div>
          
          <div class="form-group">
            <label>電子郵件 *</label>
            <input type="email" name="email" class="form-control" required>
          </div>
          
          <div class="form-group">
            <label>地址</label>
            <input type="text" name="address" class="form-control">
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn" onclick="this.closest('.modal').remove()">取消</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> 新增會員
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function handleAddMember(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const payload = {
    name: formData.get('name'),
    gender: formData.get('gender'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    birthDate: formData.get('birthDate')
  };
  
  const result = await callAPI('addMember', payload);
  
  if (result.success) {
    showToast('會員新增成功！', 'success');
    form.closest('.modal').remove();
    await loadMembers(currentMembersPage);
  } else {
    showToast(result.error || '新增失敗', 'error');
  }
}

function showMemberDetail(memberId) {
  showToast('會員詳情功能開發中', 'info');
}

function showEditMemberModal(memberId) {
  showToast('編輯會員功能開發中', 'info');
}

// ==================== 儀表板頁面 ====================
async function renderDashboardPage() {
  if (currentUser.role !== 'admin') {
    document.getElementById('app').innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-lock"></i>
          <h2>權限不足</h2>
          <p>您沒有權限訪問此頁面</p>
        </div>
      </div>
    `;
    return;
  }
  
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1><i class="fas fa-chart-line"></i> 數據儀表板</h1>
      </div>
      
      <div class="kpi-grid" id="dashboardStats">
        <div class="card"><p>載入中...</p></div>
      </div>
      
      <div class="grid grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-chart-line"></i> 會員成長趨勢</h3>
          </div>
          <div class="card-body">
            <canvas id="memberGrowthChart"></canvas>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-chart-pie"></i> 活動類型分布</h3>
          </div>
          <div class="card-body">
            <canvas id="activityTypeChart"></canvas>
          </div>
        </div>
      </div>
      
      <div class="card mt-2">
        <div class="card-header">
          <h3 class="card-title"><i class="fas fa-chart-bar"></i> 參與趨勢</h3>
        </div>
        <div class="card-body">
          <canvas id="participationTrendChart"></canvas>
        </div>
      </div>
      
      <div class="grid grid-2 mt-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-trophy"></i> 熱門活動 Top 5</h3>
          </div>
          <div id="topActivities">
            <p>載入中...</p>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title"><i class="fas fa-star"></i> 活躍會員 Top 5</h3>
          </div>
          <div id="topMembers">
            <p>載入中...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  await loadDashboardData();
}

async function loadDashboardData() {
  const result = await callAPI('getDashboardData', { period: '30' });
  
  if (result.success) {
    const { stats, memberGrowth, activityTypes, participationTrend, topActivities, topMembers } = result;
    
    // 更新統計卡片
    document.getElementById('dashboardStats').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <i class="fas fa-users"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.totalMembers}</h3>
          <p>總會員數</p>
          <div class="kpi-trend positive">
            <i class="fas fa-arrow-up"></i>
            <span>${stats.membersChange}%</span>
          </div>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.totalActivities}</h3>
          <p>總活動數</p>
          <div class="kpi-trend positive">
            <i class="fas fa-arrow-up"></i>
            <span>${stats.activitiesChange}%</span>
          </div>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.totalParticipations}</h3>
          <p>總參與次數</p>
          <div class="kpi-trend positive">
            <i class="fas fa-arrow-up"></i>
            <span>${stats.participationsChange}%</span>
          </div>
        </div>
      </div>
      
      <div class="kpi-card">
        <div class="kpi-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <i class="fas fa-percentage"></i>
        </div>
        <div class="kpi-content">
          <h3>${stats.avgAttendanceRate}%</h3>
          <p>平均出席率</p>
          <div class="kpi-trend positive">
            <i class="fas fa-arrow-up"></i>
            <span>${stats.attendanceChange}%</span>
          </div>
        </div>
      </div>
    `;
    
    // 繪製圖表
    renderMemberGrowthChart(memberGrowth);
    renderActivityTypeChart(activityTypes);
    renderParticipationTrendChart(participationTrend);
    renderTopActivities(topActivities);
    renderTopMembers(topMembers);
  }
}

function renderMemberGrowthChart(data) {
  const ctx = document.getElementById('memberGrowthChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: '會員數',
        data: data.values,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderActivityTypeChart(data) {
  const ctx = document.getElementById('activityTypeChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: [
          '#667eea',
          '#f093fb',
          '#4facfe',
          '#fa709a',
          '#feca57'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderParticipationTrendChart(data) {
  const ctx = document.getElementById('participationTrendChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: '報名數',
          data: data.registrations,
          backgroundColor: 'rgba(102, 126, 234, 0.8)'
        },
        {
          label: '出席數',
          data: data.attendances,
          backgroundColor: 'rgba(52, 168, 83, 0.8)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderTopActivities(activities) {
  if (activities.length === 0) {
    document.getElementById('topActivities').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-times"></i>
        <p>目前沒有資料</p>
      </div>
    `;
  } else {
    document.getElementById('topActivities').innerHTML = activities.map((activity, index) => `
      <div class="ranking-item">
        <div class="ranking-number ${index < 3 ? 'top-' + (index + 1) : ''}">${index + 1}</div>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 0.2rem 0;">${activity['活動名稱']}</h4>
          <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${activity['活動類型']}</p>
        </div>
        <div class="ranking-value">${activity['參與人數']} 人</div>
      </div>
    `).join('');
  }
}

function renderTopMembers(members) {
  if (members.length === 0) {
    document.getElementById('topMembers').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-times"></i>
        <p>目前沒有資料</p>
      </div>
    `;
  } else {
    document.getElementById('topMembers').innerHTML = members.map((member, index) => `
      <div class="ranking-item">
        <div class="ranking-number ${index < 3 ? 'top-' + (index + 1) : ''}">${index + 1}</div>
        <div class="ranking-avatar">${member['姓名'].charAt(0)}</div>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 0.2rem 0;">${member['姓名']}</h4>
          <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${member['積分']} 積分</p>
        </div>
        <div class="ranking-value">${member['參與次數']} 次</div>
      </div>
    `).join('');
  }
}

// ==================== 報表頁面 ====================
async function renderReportsPage() {
  if (currentUser.role !== 'admin') {
    document.getElementById('app').innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-lock"></i>
          <h2>權限不足</h2>
          <p>您沒有權限訪問此頁面</p>
        </div>
      </div>
    `;
    return;
  }
  
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1><i class="fas fa-file-alt"></i> 報表管理</h1>
        <button class="btn btn-primary" onclick="showGenerateReportModal()">
          <i class="fas fa-plus"></i> 產生報表
        </button>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>報表名稱</th>
              <th>報表類型</th>
              <th>產生時間</th>
              <th>產生者</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="reportsTableBody">
            <tr><td colspan="6" style="text-align: center;">載入中...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  await loadReports();
}

async function loadReports() {
  const result = await callAPI('getReports', {});
  
  if (result.success) {
    const reports = result.reports;
    
    if (reports.length === 0) {
      document.getElementById('reportsTableBody').innerHTML = `
        <tr><td colspan="6" style="text-align: center;">目前沒有報表</td></tr>
      `;
    } else {
      document.getElementById('reportsTableBody').innerHTML = reports.map(report => `
        <tr>
          <td>${report['報表名稱']}</td>
          <td>${report['報表類型']}</td>
          <td>${formatDate(report['產生時間'])}</td>
          <td>${report['產生者']}</td>
          <td><span class="status-badge active">${report['狀態']}</span></td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="downloadReport('${report['報表ID']}')">
              <i class="fas fa-download"></i> 下載
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteReport('${report['報表ID']}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  }
}

function showGenerateReportModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="close-modal" onclick="this.closest('.modal').remove()">
        <i class="fas fa-times"></i>
      </div>
      <div class="modal-header">
        <h2><i class="fas fa-file-alt"></i> 產生報表</h2>
      </div>
      <div class="modal-body">
        <form id="generateReportForm" onsubmit="handleGenerateReport(event)">
          <div class="form-group">
            <label>報表名稱 *</label>
            <input type="text" name="name" class="form-control" required>
          </div>
          
          <div class="form-group">
            <label>報表類型 *</label>
            <select name="type" class="form-control" required>
              <option value="">請選擇</option>
              <option value="會員統計">會員統計</option>
              <option value="活動統計">活動統計</option>
              <option value="參與統計">參與統計</option>
              <option value="綜合報表">綜合報表</option>
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>開始日期 *</label>
              <input type="date" name="startDate" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label>結束日期 *</label>
              <input type="date" name="endDate" class="form-control" required>
            </div>
          </div>
          
          <div class="form-group">
            <label>匯出格式 *</label>
            <select name="format" class="form-control" required>
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn" onclick="this.closest('.modal').remove()">取消</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-file-export"></i> 產生報表
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function handleGenerateReport(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const payload = {
    name: formData.get('name'),
    type: formData.get('type'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    format: formData.get('format'),
    generatedBy: currentUser.name
  };
  
  const result = await callAPI('generateReport', payload);
  
  if (result.success) {
    showToast('報表產生成功！', 'success');
    form.closest('.modal').remove();
    await loadReports();
    
    // 自動下載
    if (result.downloadUrl) {
      window.open(result.downloadUrl, '_blank');
    }
  } else {
    showToast(result.error || '產生失敗', 'error');
  }
}

async function downloadReport(reportId) {
  const result = await callAPI('getReportDownloadUrl', { reportId });
  if (result.success && result.url) {
    window.open(result.url, '_blank');
  } else {
    showToast('下載失敗', 'error');
  }
}

async function deleteReport(reportId) {
  if (!confirm('確定要刪除此報表嗎？')) return;
  
  const result = await callAPI('deleteReport', { reportId });
  
  if (result.success) {
    showToast('報表已刪除', 'success');
    await loadReports();
  } else {
    showToast('刪除失敗', 'error');
  }
}

// ==================== 個人資料頁面 ====================
async function renderProfilePage() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="card">
        <div class="profile-cover" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <h2 style="color: white; margin: 0;">個人資料</h2>
        </div>
        
        <div class="profile-info-header">
          <div class="profile-avatar-large">
            ${currentUser.name.charAt(0)}
            <div class="avatar-edit-btn">
              <i class="fas fa-camera"></i>
            </div>
          </div>
          <div style="flex: 1;">
            <h2 style="margin: 0 0 0.3rem 0;">${currentUser.name}</h2>
            <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">${currentUser.email}</p>
            <div class="profile-badges">
              <span class="badge badge-success">
                <i class="fas fa-check-circle"></i> 已驗證
              </span>
              <span class="badge">
                <i class="fas fa-calendar"></i> 加入於 ${formatDate(currentUser.joinDate)}
              </span>
            </div>
          </div>
        </div>
        
        <div class="profile-stats" id="profileStats">
          <div class="card"><p>載入中...</p></div>
        </div>
      </div>
      
      <div class="profile-tabs mt-2">
        <div class="tabs-header">
          <button class="tab-btn active" onclick="switchProfileTab('info')">基本資料</button>
          <button class="tab-btn" onclick="switchProfileTab('activities')">活動記錄</button>
          <button class="tab-btn" onclick="switchProfileTab('achievements')">成就</button>
          <button class="tab-btn" onclick="switchProfileTab('timeline')">動態</button>
        </div>
        <div id="profileTabContent">
          <div class="card"><p>載入中...</p></div>
        </div>
      </div>
    </div>
  `;
  
  await loadProfileData();
  switchProfileTab('info');
}

async function loadProfileData() {
  const result = await callAPI('getProfileStats', { memberId: currentUser.id });
  
  if (result.success) {
    const { stats } = result;
    
    document.getElementById('profileStats').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <i class="fas fa-calendar-check"></i>
        </div>
        <div class="stat-content">
          <h3>${stats.activitiesCount}</h3>
          <p>參與活動</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <i class="fas fa-percentage"></i>
        </div>
        <div class="stat-content">
          <h3>${stats.attendanceRate}%</h3>
          <p>出席率</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <i class="fas fa-star"></i>
        </div>
        <div class="stat-content">
          <h3>${stats.points}</h3>
          <p>累積積分</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>${stats.memberDays}</h3>
          <p>會員天數</p>
        </div>
      </div>
    `;
  }
}

let currentProfileTab = 'info';

async function switchProfileTab(tab) {
  currentProfileTab = tab;
  
  // 更新按鈕狀態
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // 載入對應內容
  switch(tab) {
    case 'info':
      await loadProfileInfo();
      break;
    case 'activities':
      await loadProfileActivities();
      break;
    case 'achievements':
      await loadProfileAchievements();
      break;
    case 'timeline':
      await loadProfileTimeline();
      break;
  }
}

async function loadProfileInfo() {
  const result = await callAPI('getMemberProfile', { memberId: currentUser.id });
  
  if (result.success) {
    const profile = result.profile;
    
    document.getElementById('profileTabContent').innerHTML = `
      <div class="info-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3><i class="fas fa-user"></i> 基本資料</h3>
          <button class="btn btn-sm btn-primary" onclick="showEditProfileModal()">
            <i class="fas fa-edit"></i> 編輯
          </button>
        </div>
        
        <div class="info-items">
          <div class="info-item">
            <label>會員ID</label>
            <p>${profile['會員ID']}</p>
          </div>
          
          <div class="info-item">
            <label>姓名</label>
            <p>${profile['姓名']}</p>
          </div>
          
          <div class="info-item">
            <label>性別</label>
            <p>${profile['性別']}</p>
          </div>
          
          <div class="info-item">
            <label>出生日期</label>
            <p>${profile['出生日期'] || '未設定'}</p>
          </div>
          
          <div class="info-item">
            <label>電話</label>
            <p>${profile['電話']}</p>
          </div>
          
          <div class="info-item">
            <label>電子郵件</label>
            <p>${profile['電子郵件']}</p>
          </div>
          
          <div class="info-item full-width">
            <label>地址</label>
            <p>${profile['地址'] || '未設定'}</p>
          </div>
          
          <div class="info-item">
            <label>加入日期</label>
            <p>${formatDate(profile['加入日期'])}</p>
          </div>
          
          <div class="info-item">
            <label>狀態</label>
            <p><span class="status-badge ${profile['狀態'] === '啟用' ? 'active' : 'inactive'}">${profile['狀態']}</span></p>
          </div>
          
          <div class="info-item">
            <label>積分</label>
            <p>${profile['積分'] || 0}</p>
          </div>
          
          <div class="info-item">
            <label>參與活動數</label>
            <p>${profile['參與活動數'] || 0}</p>
          </div>
          
          <div class="info-item">
            <label>緊急聯絡人</label>
            <p>${profile['緊急聯絡人'] || '未設定'}</p>
          </div>
          
          <div class="info-item">
            <label>緊急聯絡電話</label>
            <p>${profile['緊急聯絡電話'] || '未設定'}</p>
          </div>
        </div>
      </div>
    `;
  }
}

async function loadProfileActivities() {
  const result = await callAPI('getMemberActivities', { memberId: currentUser.id });
  
  if (result.success) {
    const activities = result.activities;
    
    if (activities.length === 0) {
      document.getElementById('profileTabContent').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-times"></i>
          <p>目前沒有活動記錄</p>
        </div>
      `;
    } else {
      document.getElementById('profileTabContent').innerHTML = `
        <div class="card">
          <h3 style="margin-bottom: 1rem;"><i class="fas fa-history"></i> 活動記錄</h3>
          ${activities.map(activity => `
            <div class="activity-record-item">
              <div class="activity-record-icon" style="background: ${activity['已簽到'] ? 'var(--secondary-color)' : 'var(--primary-color)'};">
                <i class="fas ${activity['已簽到'] ? 'fa-check' : 'fa-calendar'}"></i>
              </div>
              <div style="flex: 1;">
                <h4 style="margin: 0 0 0.2rem 0;">${activity['活動名稱']}</h4>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                  <i class="fas fa-clock"></i> ${formatDate(activity['開始時間'])}
                  <span style="margin-left: 1rem;"><i class="fas fa-map-marker-alt"></i> ${activity['活動地點']}</span>
                </p>
              </div>
              <span class="status-badge ${activity['已簽到'] ? 'active' : 'upcoming'}">
                ${activity['已簽到'] ? '已出席' : '未出席'}
              </span>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}

async function loadProfileAchievements() {
  const result = await callAPI('getUserAchievements', { memberId: currentUser.id });
  
  if (result.success) {
    const achievements = result.achievements;
    
    if (achievements.length === 0) {
      document.getElementById('profileTabContent').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <p>目前沒有成就</p>
        </div>
      `;
    } else {
      document.getElementById('profileTabContent').innerHTML = `
        <div class="card">
          <h3 style="margin-bottom: 1rem;"><i class="fas fa-trophy"></i> 我的成就</h3>
          <div class="grid grid-3">
            ${achievements.map(achievement => `
              <div class="card" style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏆</div>
                <h4 style="margin: 0 0 0.3rem 0;">${achievement.name}</h4>
                <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">${achievement.description}</p>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">
                  <i class="fas fa-calendar"></i> ${formatDate(achievement.unlockedDate)}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }
}

async function loadProfileTimeline() {
  const result = await callAPI('getUserTimeline', { memberId: currentUser.id });
  
  if (result.success) {
    const timeline = result.timeline;
    
    if (timeline.length === 0) {
      document.getElementById('profileTabContent').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-stream"></i>
          <p>目前沒有動態</p>
        </div>
      `;
    } else {
      document.getElementById('profileTabContent').innerHTML = `
        <div class="card">
          <h3 style="margin-bottom: 1rem;"><i class="fas fa-stream"></i> 我的動態</h3>
          ${timeline.map(item => {
            const iconMap = {
              join: 'fa-user-plus',
              activity: 'fa-calendar-check',
              achievement: 'fa-trophy',
              post: 'fa-comment'
            };
            
            const colorMap = {
              join: 'var(--primary-color)',
              activity: 'var(--secondary-color)',
              achievement: 'var(--warning-color)',
              post: 'var(--primary-color)'
            };
            
            return `
              <div class="timeline-item">
                <div class="timeline-marker" style="background: ${colorMap[item.type] || 'var(--primary-color)'};">
                  <i class="fas ${iconMap[item.type] || 'fa-circle'}"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <h4 style="margin: 0;">${item.title}</h4>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">
                      ${formatDate(item.timestamp)}
                    </span>
                  </div>
                  <p style="margin: 0.3rem 0 0 0; color: var(--text-secondary);">${item.description}</p>
                  ${item.image ? `<img src="${item.image}" alt="" class="timeline-image">` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }
}

function showEditProfileModal() {
  showToast('編輯個人資料功能開發中', 'info');
}

// ==================== 設定頁面 ====================
async function renderSettingsPage() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1><i class="fas fa-cog"></i> 設定</h1>
      </div>
      
      <div class="settings-container">
        <div class="settings-sidebar">
          <button class="settings-tab-btn active" onclick="switchSettingsTab('general')">
            <i class="fas fa-sliders-h"></i> 一般設定
          </button>
          <button class="settings-tab-btn" onclick="switchSettingsTab('account')">
            <i class="fas fa-user-cog"></i> 帳號設定
          </button>
          <button class="settings-tab-btn" onclick="switchSettingsTab('notifications')">
            <i class="fas fa-bell"></i> 通知設定
          </button>
          <button class="settings-tab-btn" onclick="switchSettingsTab('privacy')">
            <i class="fas fa-shield-alt"></i> 隱私設定
          </button>
          <button class="settings-tab-btn" onclick="switchSettingsTab('about')">
            <i class="fas fa-info-circle"></i> 關於
          </button>
        </div>
        
        <div class="settings-content">
          <div class="card" id="settingsTabContent">
            <p>載入中...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  switchSettingsTab('general');
}

function switchSettingsTab(tab) {
  // 更新按鈕狀態
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // 載入對應內容
  switch(tab) {
    case 'general':
      loadGeneralSettings();
      break;
    case 'account':
      loadAccountSettings();
      break;
    case 'notifications':
      loadNotificationSettings();
      break;
    case 'privacy':
      loadPrivacySettings();
      break;
    case 'about':
      loadAboutSettings();
      break;
  }
}

function loadGeneralSettings() {
  document.getElementById('settingsTabContent').innerHTML = `
    <h3 style="margin-bottom: 1rem;"><i class="fas fa-sliders-h"></i> 一般設定</h3>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>深色模式</h4>
        <p>切換深色主題以減少眼睛疲勞</p>
      </div>
      <label class="switch">
        <input type="checkbox" ${isDarkTheme ? 'checked' : ''} onchange="toggleDarkTheme()">
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>語言</h4>
        <p>選擇介面語言</p>
      </div>
      <select class="form-control" style="width: 150px;">
        <option value="zh-TW" selected>繁體中文</option>
        <option value="zh-CN">简体中文</option>
        <option value="en">English</option>
      </select>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>時區</h4>
        <p>設定顯示時間的時區</p>
      </div>
      <select class="form-control" style="width: 200px;">
        <option value="Asia/Taipei" selected>台北 (GMT+8)</option>
        <option value="Asia/Shanghai">上海 (GMT+8)</option>
        <option value="Asia/Hong_Kong">香港 (GMT+8)</option>
      </select>
    </div>
  `;
}

function loadAccountSettings() {
  document.getElementById('settingsTabContent').innerHTML = `
    <h3 style="margin-bottom: 1rem;"><i class="fas fa-user-cog"></i> 帳號設定</h3>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>變更電子郵件</h4>
        <p>更新您的電子郵件地址</p>
      </div>
      <button class="btn btn-sm" onclick="showChangeEmailModal()">
        <i class="fas fa-edit"></i> 變更
      </button>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>變更密碼</h4>
        <p>定期更新密碼以保護帳號安全</p>
      </div>
      <button class="btn btn-sm" onclick="showChangePasswordModal()">
        <i class="fas fa-key"></i> 變更
      </button>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>匯出個人資料</h4>
        <p>下載您的所有個人資料</p>
      </div>
      <button class="btn btn-sm btn-primary" onclick="exportUserData()">
        <i class="fas fa-download"></i> 匯出
      </button>
    </div>
    
    <div class="setting-item" style="border-bottom: none;">
      <div class="setting-info">
        <h4>刪除帳號</h4>
        <p style="color: var(--danger-color);">永久刪除您的帳號及所有資料</p>
      </div>
      <button class="btn btn-sm btn-danger" onclick="showDeleteAccountModal()">
        <i class="fas fa-trash"></i> 刪除
      </button>
    </div>
  `;
}

function loadNotificationSettings() {
  document.getElementById('settingsTabContent').innerHTML = `
    <h3 style="margin-bottom: 1rem;"><i class="fas fa-bell"></i> 通知設定</h3>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>電子郵件通知</h4>
        <p>接收重要更新的電子郵件</p>
      </div>
      <label class="switch">
        <input type="checkbox" checked>
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>推播通知</h4>
        <p>接收即時推播通知</p>
      </div>
      <label class="switch">
        <input type="checkbox" checked onchange="togglePushNotifications(this)">
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>活動提醒</h4>
        <p>在活動開始前收到提醒</p>
      </div>
      <label class="switch">
        <input type="checkbox" checked>
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>系統公告</h4>
        <p>接收系統重要公告</p>
      </div>
      <label class="switch">
        <input type="checkbox" checked>
        <span class="slider"></span>
      </label>
    </div>
  `;
}

function loadPrivacySettings() {
  document.getElementById('settingsTabContent').innerHTML = `
    <h3 style="margin-bottom: 1rem;"><i class="fas fa-shield-alt"></i> 隱私設定</h3>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>個人資料可見性</h4>
        <p>控制誰可以查看您的個人資料</p>
      </div>
      <select class="form-control" style="width: 150px;">
        <option value="public">公開</option>
        <option value="members" selected>僅會員</option>
        <option value="private">私密</option>
      </select>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>活動記錄可見性</h4>
        <p>控制誰可以查看您的活動記錄</p>
      </div>
      <select class="form-control" style="width: 150px;">
        <option value="public">公開</option>
        <option value="members" selected>僅會員</option>
        <option value="private">私密</option>
      </select>
    </div>
    
    <div class="setting-item">
      <div class="setting-info">
        <h4>允許搜尋</h4>
        <p>允許其他人透過搜尋找到您</p>
      </div>
      <label class="switch">
        <input type="checkbox" checked>
        <span class="slider"></span>
      </label>
    </div>
  `;
}

function loadAboutSettings() {
  document.getElementById('settingsTabContent').innerHTML = `
    <h3 style="margin-bottom: 1rem;"><i class="fas fa-info-circle"></i> 關於</h3>
    
    <div style="text-align: center; padding: 2rem;">
      <i class="fas fa-brain" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
      <h2 style="margin: 0 0 0.5rem 0;">腦帕金森病友會管理系統</h2>
      <p style="color: var(--text-secondary); margin: 0 0 2rem 0;">版本 1.0.0</p>
      
      <div style="text-align: left; max-width: 500px; margin: 0 auto;">
        <div class="setting-item">
          <div class="setting-info">
            <h4>使用條款</h4>
          </div>
          <button class="btn btn-sm">
            <i class="fas fa-external-link-alt"></i> 查看
          </button>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>隱私政策</h4>
          </div>
          <button class="btn btn-sm">
            <i class="fas fa-external-link-alt"></i> 查看
          </button>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>開放原始碼授權</h4>
          </div>
          <button class="btn btn-sm">
            <i class="fas fa-external-link-alt"></i> 查看
          </button>
        </div>
        
        <div class="setting-item" style="border-bottom: none;">
          <div class="setting-info">
            <h4>聯絡我們</h4>
          </div>
          <button class="btn btn-sm">
            <i class="fas fa-envelope"></i> 聯絡
          </button>
        </div>
      </div>
      
      <p style="color: var(--text-secondary); margin-top: 2rem; font-size: 0.9rem;">
        © 2025 腦帕金森病友會. All rights reserved.
      </p>
    </div>
  `;
}

function toggleDarkTheme() {
  isDarkTheme = !isDarkTheme;
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
}

function showChangeEmailModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="close-modal" onclick="this.closest('.modal').remove()">
        <i class="fas fa-times"></i>
      </div>
      <div class="modal-header">
        <h2><i class="fas fa-envelope"></i> 變更電子郵件</h2>
      </div>
      <div class="modal-body">
        <form id="changeEmailForm" onsubmit="handleChangeEmail(event)">
          <div class="form-group">
            <label>目前電子郵件</label>
            <input type="email" class="form-control" value="${currentUser.email}" disabled>
          </div>
          
          <div class="form-group">
            <label>新電子郵件 *</label>
            <input type="email" name="newEmail" class="form-control" required>
          </div>
          
          <div class="form-group">
            <label>確認密碼 *</label>
            <input type="password" name="password" class="form-control" required>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn" onclick="this.closest('.modal').remove()">取消</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> 確認變更
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function handleChangeEmail(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const result = await callAPI('updateEmail', {
    memberId: currentUser.id,
    newEmail: formData.get('newEmail'),
    password: formData.get('password')
  });
  
  if (result.success) {
    showToast('電子郵件已更新', 'success');
    form.closest('.modal').remove();
    currentUser.email = formData.get('newEmail');
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  } else {
    showToast(result.error || '更新失敗', 'error');
  }
}

function showChangePasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="close-modal" onclick="this.closest('.modal').remove()">
        <i class="fas fa-times"></i>
      </div>
      <div class="modal-header">
        <h2><i class="fas fa-key"></i> 變更密碼</h2>
      </div>
      <div class="modal-body">
        <form id="changePasswordForm" onsubmit="handleChangePassword(event)">
          <div class="form-group">
            <label>目前密碼 *</label>
            <input type="password" name="currentPassword" class="form-control" required>
          </div>
          
          <div class="form-group">
            <label>新密碼 *</label>
            <input type="password" name="newPassword" class="form-control" minlength="6" required>
          </div>
          
          <div class="form-group">
            <label>確認新密碼 *</label>
            <input type="password" name="confirmPassword" class="form-control" minlength="6" required>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn" onclick="this.closest('.modal').remove()">取消</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> 確認變更
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function handleChangePassword(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');
  
  if (newPassword !== confirmPassword) {
    showToast('新密碼與確認密碼不符', 'error');
    return;
  }
  
  const result = await callAPI('changePassword', {
    memberId: currentUser.id,
    currentPassword: formData.get('currentPassword'),
    newPassword: newPassword
  });
  
  if (result.success) {
    showToast('密碼已更新', 'success');
    form.closest('.modal').remove();
  } else {
    showToast(result.error || '更新失敗', 'error');
  }
}

async function exportUserData() {
  const result = await callAPI('exportUserData', { memberId: currentUser.id });
  
  if (result.success && result.downloadUrl) {
    window.open(result.downloadUrl, '_blank');
    showToast('資料匯出成功', 'success');
  } else {
    showToast('匯出失敗', 'error');
  }
}

function showDeleteAccountModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="close-modal" onclick="this.closest('.modal').remove()">
        <i class="fas fa-times"></i>
      </div>
      <div class="modal-header">
        <h2 style="color: var(--danger-color);"><i class="fas fa-exclamation-triangle"></i> 刪除帳號</h2>
      </div>
      <div class="modal-body">
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <p style="margin: 0; color: #856404;">
            <strong>警告：</strong>此操作無法復原！刪除帳號後，您的所有資料將永久移除。
          </p>
        </div>
        
        <form id="deleteAccountForm" onsubmit="handleDeleteAccount(event)">
          <div class="form-group">
            <label>請輸入您的密碼以確認刪除 *</label>
            <input type="password" name="password" class="form-control" required>
          </div>
          
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" name="confirm" required>
              <span>我了解此操作無法復原</span>
            </label>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn" onclick="this.closest('.modal').remove()">取消</button>
            <button type="submit" class="btn btn-danger">
              <i class="fas fa-trash"></i> 確認刪除
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function handleDeleteAccount(event) {
  event.preventDefault();
  
  if (!confirm('您確定要刪除帳號嗎？此操作無法復原！')) {
    return;
  }
  
  const form = event.target;
  const formData = new FormData(form);
  
  const result = await callAPI('deleteAccount', {
    memberId: currentUser.id,
    password: formData.get('password')
  });
  
  if (result.success) {
    showToast('帳號已刪除', 'info');
    handleLogout();
  } else {
    showToast(result.error || '刪除失敗', 'error');
  }
}

function togglePushNotifications(checkbox) {
  if (checkbox.checked) {
    requestPushPermission();
  } else {
    // 取消推播訂閱
    showToast('推播通知已關閉', 'info');
  }
}

async function requestPushPermission() {
  if (!('Notification' in window)) {
    showToast('您的瀏覽器不支援推播通知', 'warning');
    return;
  }
  
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    showToast('推播通知已啟用', 'success');
    // 這裡可以註冊 Service Worker 並訂閱推播
  } else {
    showToast('推播通知權限被拒絕', 'warning');
  }
}

// ==================== 通知頁面 ====================
async function renderNotificationsPage() {
  document.getElementById('app').innerHTML = `
    <div class="container">
      <div class="page-header">
        <h1><i class="fas fa-bell"></i> 通知中心</h1>
        <button class="btn btn-sm" onclick="markAllNotificationsAsRead()">
          <i class="fas fa-check-double"></i> 全部標為已讀
        </button>
      </div>
      
      <div class="card" id="notificationsList">
        <p>載入中...</p>
      </div>
    </div>
  `;
  
  await loadNotificationsList();
}

async function loadNotificationsList() {
  const result = await callAPI('getNotifications', { memberId: currentUser.id });
  
  if (result.success) {
    const notifications = result.notifications;
    
    if (notifications.length === 0) {
      document.getElementById('notificationsList').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bell-slash"></i>
          <p>目前沒有通知</p>
        </div>
      `;
    } else {
      document.getElementById('notificationsList').innerHTML = notifications.map(notif => `
        <div class="activity-record-item" style="${notif.read ? 'opacity: 0.6;' : ''}" onclick="markNotificationAsRead('${notif.id}')">
          <div class="activity-record-icon" style="background: ${getNotificationColor(notif.type)};">
            <i class="fas ${getNotificationIcon(notif.type)}"></i>
          </div>
          <div style="flex: 1;">
            <h4 style="margin: 0 0 0.2rem 0;">${notif.title}</h4>
            <p style="margin: 0 0 0.3rem 0; color: var(--text-secondary);">${notif.message}</p>
            <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">
              <i class="fas fa-clock"></i> ${formatDate(notif.timestamp)}
            </p>
          </div>
          ${!notif.read ? '<span class="status-badge active">新</span>' : ''}
        </div>
      `).join('');
    }
  }
}

async function markNotificationAsRead(notificationId) {
  await callAPI('markNotificationAsRead', { notificationId });
  await loadNotificationsList();
  await loadNotifications();
}

async function markAllNotificationsAsRead() {
  await callAPI('markAllNotificationsAsRead', { memberId: currentUser.id });
  showToast('已全部標為已讀', 'success');
  await loadNotificationsList();
  await loadNotifications();
}

function getNotificationIcon(type) {
  const icons = {
    activity: 'fa-calendar',
    system: 'fa-info-circle',
    achievement: 'fa-trophy',
    message: 'fa-comment'
  };
  return icons[type] || 'fa-bell';
}

function getNotificationColor(type) {
  const colors = {
    activity: 'var(--primary-color)',
    system: 'var(--secondary-color)',
    achievement: 'var(--warning-color)',
    message: 'var(--primary-color)'
  };
  return colors[type] || 'var(--primary-color)';
}

// ==================== 工具函數 ====================
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getActivityStatus(startTime, endTime) {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'completed';
}

function getActivityStatusText(startTime, endTime) {
  const status = getActivityStatus(startTime, endTime);
  const statusText = {
    upcoming: '即將舉辦',
    ongoing: '進行中',
    completed: '已結束'
  };
  return statusText[status];
}

function renderPagination(containerId, pagination, loadFunction) {
  const { currentPage, totalPages } = pagination;
  
  if (totalPages <= 1) {
    document.getElementById(containerId).innerHTML = '';
    return;
  }
  
  let html = '';
  
  // 上一頁
  html += `
    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${loadFunction.name}(${currentPage - 1})">
      <i class="fas fa-chevron-left"></i>
    </button>
  `;
  
  // 頁碼
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `
        <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="${loadFunction.name}(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<span style="padding: 0 0.5rem;">...</span>';
    }
  }
  
  // 下一頁
  html += `
    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${loadFunction.name}(${currentPage + 1})">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  document.getElementById(containerId).innerHTML = html;
}

// ==================== 點擊外部關閉下拉選單 ====================
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
  }
});

// ==================== PWA 安裝提示 ====================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // 顯示安裝提示
  showToast('點擊安裝按鈕，將此應用程式加入主畫面', 'info');
});

window.addEventListener('appinstalled', () => {
  showToast('應用程式已安裝成功！', 'success');
  deferredPrompt = null;
});
