// app.js - 主要應用程式邏輯

// 配置設定
const CONFIG = {
  WEB_APP_URL: 'YOUR_WEB_APP_URL_HERE', // 請替換為您的 Web App URL
  API_TIMEOUT: 30000, // 30秒超時
  PAGE_SIZE: 20, // 每頁顯示數量
  CURRENCY_SYMBOL: 'NT$'
};

// 全域變數
let currentPage = 1;
let currentModule = 'dashboard';
let membersData = [];
let currentMemberFilters = {};

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

/**
 * 應用程式初始化
 */
function initializeApp() {
  // 檢查Web App URL是否已設定
  if (CONFIG.WEB_APP_URL === 'YOUR_WEB_APP_URL_HERE') {
      Swal.fire({
          icon: 'warning',
          title: '設定未完成',
          text: '請先在 app.js 中設定您的 Web App URL',
          confirmButtonText: '確定'
      });
      return;
  }

  // 初始化事件監聽器
  initializeEventListeners();
  
  // 載入儀表板
  showDashboard();
  
  // 檢查系統狀態
  checkSystemHealth();
}

/**
 * 初始化事件監聽器
 */
function initializeEventListeners() {
  // 側邊欄切換（手機版）
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function() {
          document.getElementById('sidebar').classList.toggle('show');
      });
  }

  // 會員搜尋
  const memberSearch = document.getElementById('memberSearch');
  if (memberSearch) {
      memberSearch.addEventListener('keyup', debounce(searchMembers, 500));
  }

  // 篩選器變更
  const memberTypeFilter = document.getElementById('memberTypeFilter');
  const memberStatusFilter = document.getElementById('memberStatusFilter');
  
  if (memberTypeFilter) {
      memberTypeFilter.addEventListener('change', searchMembers);
  }
  if (memberStatusFilter) {
      memberStatusFilter.addEventListener('change', searchMembers);
  }

  // 表單驗證
  setupFormValidation();
}

/**
 * 防抖函數
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
      const later = () => {
          clearTimeout(timeout);
          func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
  };
}

/**
 * API 調用函數
 */
async function callAPI(action, data = {}, showLoading = true) {
  try {
      if (showLoading) {
          showLoadingSpinner();
      }

      const response = await fetch(CONFIG.WEB_APP_URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              action: action,
              data: data
          })
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (showLoading) {
          hideLoadingSpinner();
      }

      return result;
  } catch (error) {
      if (showLoading) {
          hideLoadingSpinner();
      }
      
      console.error('API調用錯誤:', error);
      
      Swal.fire({
          icon: 'error',
          title: '連線錯誤',
          text: '無法連接到伺服器，請檢查網路連線或稍後再試',
          confirmButtonText: '確定'
      });
      
      return {
          success: false,
          message: '網路錯誤或服務不可用',
          error: error.message
      };
  }
}

/**
 * 顯示載入動畫
 */
function showLoadingSpinner(containerId = null) {
  if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
          container.style.display = 'block';
      }
  } else {
      // 全域載入動畫
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'globalLoading';
      loadingOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
      loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
      loadingOverlay.style.zIndex = '9999';
      loadingOverlay.innerHTML = `
          <div class="text-center text-white">
              <div class="spinner mb-3"></div>
              <p>處理中...</p>
          </div>
      `;
      document.body.appendChild(loadingOverlay);
  }
}

/**
 * 隱藏載入動畫
 */
function hideLoadingSpinner(containerId = null) {
  if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
          container.style.display = 'none';
      }
  } else {
      const globalLoading = document.getElementById('globalLoading');
      if (globalLoading) {
          globalLoading.remove();
      }
  }
}

/**
 * 顯示儀表板
 */
async function showDashboard() {
  switchContent('dashboard');
  updateNavigation('dashboard');
  
  try {
      // 載入統計資料
      await loadDashboardStats();
      
      // 載入圖表
      await loadDashboardCharts();
      
      // 載入最近活動
      await loadRecentActivities();
      
  } catch (error) {
      console.error('載入儀表板錯誤:', error);
      showErrorMessage('載入儀表板資料失敗');
  }
}

/**
 * 載入儀表板統計資料
 */
async function loadDashboardStats() {
  try {
      // 載入會員統計
      const membersResult = await callAPI('getMembers', { page: 1, pageSize: 1 }, false);
      if (membersResult.success && membersResult.pagination) {
          document.getElementById('totalMembers').textContent = membersResult.pagination.totalItems;
      }

      // 載入本月收支
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const incomeResult = await callAPI('getIncome', { 
          startDate: currentMonth + '-01',
          endDate: currentMonth + '-31'
      }, false);
      
      if (incomeResult.success) {
          const totalIncome = incomeResult.data.reduce((sum, item) => 
              sum + (parseFloat(item['金額']) || 0), 0);
          document.getElementById('monthlyIncome').textContent = formatCurrency(totalIncome);
      }

      const expensesResult = await callAPI('getExpenses', { 
          startDate: currentMonth + '-01',
          endDate: currentMonth + '-31'
      }, false);
      
      if (expensesResult.success) {
          const totalExpenses = expensesResult.data.reduce((sum, item) => 
              sum + (parseFloat(item['金額']) || 0), 0);
          document.getElementById('monthlyExpenses').textContent = formatCurrency(totalExpenses);
      }

      // 載入銀行餘額
      const bankResult = await callAPI('getBankAccounts', {}, false);
      if (bankResult.success) {
          const totalBalance = bankResult.data.reduce((sum, account) => 
              sum + (parseFloat(account['目前餘額']) || 0), 0);
          document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
      }

  } catch (error) {
      console.error('載入統計資料錯誤:', error);
  }
}

/**
 * 載入儀表板圖表
 */
async function loadDashboardCharts() {
  try {
      // 收支趨勢圖
      await loadIncomeExpenseChart();
      
      // 收入來源圖
      await loadIncomeSourceChart();
      
  } catch (error) {
      console.error('載入圖表錯誤:', error);
  }
}

/**
 * 載入收支趨勢圖
 */
async function loadIncomeExpenseChart() {
  const ctx = document.getElementById('incomeExpenseChart');
  if (!ctx) return;

  try {
      // 獲取過去6個月的資料
      const months = [];
      const incomeData = [];
      const expenseData = [];

      for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toISOString().slice(0, 7);
          
          months.push(date.toLocaleDateString('zh-TW', { month: 'short' }));

          // 獲取該月收入
          const incomeResult = await callAPI('getIncome', {
              startDate: monthStr + '-01',
              endDate: monthStr + '-31'
          }, false);

          const monthIncome = incomeResult.success ? 
              incomeResult.data.reduce((sum, item) => sum + (parseFloat(item['金額']) || 0), 0) : 0;
          incomeData.push(monthIncome);

          // 獲取該月支出
          const expenseResult = await callAPI('getExpenses', {
              startDate: monthStr + '-01',
              endDate: monthStr + '-31'
          }, false);

          const monthExpense = expenseResult.success ? 
              expenseResult.data.reduce((sum, item) => sum + (parseFloat(item['金額']) || 0), 0) : 0;
          expenseData.push(monthExpense);
      }

      new Chart(ctx, {
          type: 'line',
          data: {
              labels: months,
              datasets: [{
                  label: '收入',
                  data: incomeData,
                  borderColor: '#28a745',
                  backgroundColor: 'rgba(40, 167, 69, 0.1)',
                  tension: 0.4
              }, {
                  label: '支出',
                  data: expenseData,
                  borderColor: '#dc3545',
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  tension: 0.4
              }]
          },
          options: {
              responsive: true,
              plugins: {
                  legend: {
                      position: 'top',
                  }
              },
              scales: {
                  y: {
                      beginAtZero: true,
                      ticks: {
                          callback: function(value) {
                              return formatCurrency(value);
                          }
                      }
                  }
              }
          }
      });

  } catch (error) {
      console.error('載入收支趨勢圖錯誤:', error);
  }
}

/**
 * 載入收入來源圖
 */
async function loadIncomeSourceChart() {
  const ctx = document.getElementById('incomeSourceChart');
  if (!ctx) return;

  try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const incomeResult = await callAPI('getIncome', {
          startDate: currentMonth + '-01',
          endDate: currentMonth + '-31'
      }, false);

      if (!incomeResult.success) return;

      // 按收入類別分組
      const categoryData = {};
      incomeResult.data.forEach(item => {
          const category = item['收入類別'] || '其他';
          const amount = parseFloat(item['金額']) || 0;
          categoryData[category] = (categoryData[category] || 0) + amount;
      });

      const labels = Object.keys(categoryData);
      const data = Object.values(categoryData);
      const colors = [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
      ];

      new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: labels,
              datasets: [{
                  data: data,
                  backgroundColor: colors.slice(0, labels.length),
                  borderWidth: 2,
                  borderColor: '#fff'
              }]
          },
          options: {
              responsive: true,
              plugins: {
                  legend: {
                      position: 'bottom',
                  }
              }
          }
      });

  } catch (error) {
      console.error('載入收入來源圖錯誤:', error);
  }
}

/**
 * 載入最近活動
 */
async function loadRecentActivities() {
  try {
      // 載入最近收入
      const recentIncomeResult = await callAPI('getIncome', {
          page: 1,
          pageSize: 5,
          sortBy: '日期',
          sortOrder: 'desc'
      }, false);

      if (recentIncomeResult.success) {
          displayRecentIncome(recentIncomeResult.data);
      }

      // 載入最近支出
      const recentExpensesResult = await callAPI('getExpenses', {
          page: 1,
          pageSize: 5,
          sortBy: '日期',
          sortOrder: 'desc'
      }, false);

      if (recentExpensesResult.success) {
          displayRecentExpenses(recentExpensesResult.data);
      }

  } catch (error) {
      console.error('載入最近活動錯誤:', error);
  }
}

/**
 * 顯示最近收入
 */
function displayRecentIncome(data) {
  const container = document.getElementById('recentIncome');
  if (!container || !data.length) {
      container.innerHTML = '<p class="text-muted">暫無收入記錄</p>';
      return;
  }

  const html = `
      <table class="table table-sm">
          <thead>
              <tr>
                  <th>日期</th>
                  <th>捐款人</th>
                  <th>金額</th>
                  <th>類別</th>
              </tr>
          </thead>
          <tbody>
              ${data.map(item => `
                  <tr>
                      <td>${formatDate(item['日期'])}</td>
                      <td>${item['捐款人'] || '-'}</td>
                      <td class="text-success">${formatCurrency(item['金額'])}</td>
                      <td><span class="badge bg-primary">${item['收入類別'] || '其他'}</span></td>
                  </tr>
              `).join('')}
          </tbody>
      </table>
  `;
  container.innerHTML = html;
}

/**
 * 顯示最近支出
 */
function displayRecentExpenses(data) {
  const container = document.getElementById('recentExpenses');
  if (!container || !data.length) {
      container.innerHTML = '<p class="text-muted">暫無支出記錄</p>';
      return;
  }

  const html = `
      <table class="table table-sm">
          <thead>
              <tr>
                  <th>日期</th>
                  <th>項目</th>
                  <th>金額</th>
                  <th>狀態</th>
              </tr>
          </thead>
          <tbody>
              ${data.map(item => `
                  <tr>
                      <td>${formatDate(item['日期'])}</td>
                      <td>${item['項目'] || '-'}</td>
                      <td class="text-danger">${formatCurrency(item['金額'])}</td>
                      <td>${getStatusBadge(item['核准狀態'])}</td>
                  </tr>
              `).join('')}
          </tbody>
      </table>
  `;
  container.innerHTML = html;
}

/**
 * 顯示會員管理
 */
async function showMembers() {
  switchContent('members');
  updateNavigation('members');
  currentPage = 1;
  await loadMembers();
}

/**
 * 載入會員資料
 */
async function loadMembers(page = 1) {
  try {
      showLoadingSpinner('membersLoading');
      
      const searchParams = {
          page: page,
          pageSize: CONFIG.PAGE_SIZE,
          sortBy: '加入日期',
          sortOrder: 'desc',
          ...currentMemberFilters
      };

      const result = await callAPI('getMembers', searchParams);
      
      hideLoadingSpinner('membersLoading');

      if (result.success) {
          membersData = result.data;
          displayMembersTable(result.data);
          displayMembersPagination(result.pagination);
          currentPage = page;
      } else {
          showErrorMessage(result.message || '載入會員資料失敗');
      }

  } catch (error) {
      hideLoadingSpinner('membersLoading');
      console.error('載入會員錯誤:', error);
      showErrorMessage('載入會員資料時發生錯誤');
  }
}

/**
 * 顯示會員表格
 */
function displayMembersTable(data) {
  const container = document.getElementById('membersTable');
  
  if (!data || data.length === 0) {
      container.innerHTML = `
          <div class="text-center py-5">
              <i class="fas fa-users fa-3x text-muted mb-3"></i>
              <h5 class="text-muted">暫無會員資料</h5>
              <p class="text-muted">點擊上方「新增會員」按鈕來新增第一位會員</p>
          </div>
      `;
      return;
  }

  const html = `
      <table class="table table-hover">
          <thead>
              <tr>
                  <th>姓名</th>
                  <th>電話</th>
                  <th>電子郵件</th>
                  <th>會員類型</th>
                  <th>加入日期</th>
                  <th>狀態</th>
                  <th>操作</th>
              </tr>
          </thead>
          <tbody>
              ${data.map(member => `
                  <tr>
                      <td>
                          <div class="d-flex align-items-center">
                              <div class="avatar-circle me-2">
                                  ${member['姓名'] ? member['姓名'].charAt(0) : 'M'}
                              </div>
                              <strong>${member['姓名'] || '-'}</strong>
                          </div>
                      </td>
                      <td>${member['電話'] || '-'}</td>
                      <td>${member['電子郵件'] || '-'}</td>
                      <td>
                          <span class="badge ${getMemberTypeBadgeClass(member['會員類型'])}">
                              ${member['會員類型'] || '一般會員'}
                          </span>
                      </td>
                      <td>${formatDate(member['加入日期'])}</td>
                      <td>
                          ${member['是否啟用'] ? 
                              '<span class="badge bg-success">啟用</span>' : 
                              '<span class="badge bg-secondary">停用</span>'
                          }
                      </td>
                      <td>
                          <div class="action-buttons">
                              <button class="btn btn-sm btn-outline-primary" onclick="editMember('${member['ID']}')" title="編輯">
                                  <i class="fas fa-edit"></i>
                              </button>
                              <button class="btn btn-sm btn-outline-info" onclick="viewMemberDetails('${member['ID']}')" title="詳情">
                                  <i class="fas fa-eye"></i>
                              </button>
                              <button class="btn btn-sm btn-outline-danger" onclick="deleteMember('${member['ID']}', '${member['姓名']}')" title="刪除">
                                  <i class="fas fa-trash"></i>
                              </button>
                          </div>
                      </td>
                  </tr>
              `).join('')}
          </tbody>
      </table>
  `;
  
  container.innerHTML = html;
}

/**
 * 顯示會員分頁
 */
function displayMembersPagination(pagination) {
  const container = document.getElementById('membersPagination');
  
  if (!pagination || pagination.totalPages <= 1) {
      container.innerHTML = '';
      return;
  }

  const { currentPage, totalPages } = pagination;
  let html = '';

  // 上一頁
  html += `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="loadMembers(${currentPage - 1})">
              <i class="fas fa-chevron-left"></i>
          </a>
      </li>
  `;

  // 頁碼
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" onclick="loadMembers(1)">1</a></li>`;
      if (startPage > 2) {
          html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
  }

  for (let i = startPage; i <= endPage; i++) {
      html += `
          <li class="page-item ${i === currentPage ? 'active' : ''}">
              <a class="page-link" href="#" onclick="loadMembers(${i})">${i}</a>
          </li>
      `;
  }

  if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
          html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      html += `<li class="page-item"><a class="page-link" href="#" onclick="loadMembers(${totalPages})">${totalPages}</a></li>`;
  }

  // 下一頁
  html += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="loadMembers(${currentPage + 1})">
              <i class="fas fa-chevron-right"></i>
          </a>
      </li>
  `;

  container.innerHTML = html;
}

/**
 * 搜尋會員
 */
function searchMembers() {
  const search = document.getElementById('memberSearch')?.value || '';
  const memberType = document.getElementById('memberTypeFilter')?.value || '';
  const status = document.getElementById('memberStatusFilter')?.value || '';

  currentMemberFilters = {};
  
  if (search.trim()) {
      currentMemberFilters.search = search.trim();
  }
  
  if (memberType) {
      currentMemberFilters.memberType = memberType;
  }
  
  if (status) {
      currentMemberFilters.enabled = status === 'true';
  }

  currentPage = 1;
  loadMembers(1);
}

/**
 * 顯示新增會員模態框
 */
function showAddMemberModal() {
  const modal = new bootstrap.Modal(document.getElementById('addMemberModal'));
  document.getElementById('addMemberForm').reset();
  modal.show();
}

/**
 * 新增會員
 */
async function addMember() {
  try {
      const form = document.getElementById('addMemberForm');
      const formData = new FormData(form);
      const memberData = Object.fromEntries(formData.entries());

      // 驗證必填欄位
      if (!memberData['姓名'] || !memberData['電話']) {
          showErrorMessage('請填寫必填欄位');
          return;
      }

      const result = await callAPI('addMember', memberData);

      if (result.success) {
          bootstrap.Modal.getInstance(document.getElementById('addMemberModal')).hide();
          showSuccessMessage('會員新增成功！');
          await loadMembers(currentPage);
      } else {
          showErrorMessage(result.message || '新增會員失敗');
      }

  } catch (error) {
      console.error('新增會員錯誤:', error);
      showErrorMessage('新增會員時發生錯誤');
  }
}

/**
 * 編輯會員
 */
async function editMember(memberId) {
  try {
      const member = membersData.find(m => m['ID'] === memberId);
      if (!member) {
          showErrorMessage('找不到會員資料');
          return;
      }

      // 填入表單
      document.getElementById('editMemberId').value = member['ID'];
      document.getElementById('editMemberName').value = member['姓名'] || '';
      document.getElementById('editMemberPhone').value = member['電話'] || '';
      document.getElementById('editMemberEmail').value = member['電子郵件'] || '';
      document.getElementById('editMemberType').value = member['會員類型'] || '一般會員';
      document.getElementById('editMemberAddress').value = member['地址'] || '';
      document.getElementById('editMemberNote').value = member['備註'] || '';
      document.getElementById('editMemberEnabled').checked = member['是否啟用'] || false;

      const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));
      modal.show();

  } catch (error) {
      console.error('載入會員資料錯誤:', error);
      showErrorMessage('載入會員資料失敗');
  }
}

/**
 * 更新會員
 */
async function updateMember() {
  try {
      const form = document.getElementById('editMemberForm');
      const formData = new FormData(form);
      const memberData = Object.fromEntries(formData.entries());
      
      // 處理複選框
      memberData['是否啟用'] = document.getElementById('editMemberEnabled').checked;

      // 驗證必填欄位
      if (!memberData['姓名'] || !memberData['電話']) {
          showErrorMessage('請填寫必填欄位');
          return;
      }

      const result = await callAPI('updateMember', memberData);

      if (result.success) {
          bootstrap.Modal.getInstance(document.getElementById('editMemberModal')).hide();
          showSuccessMessage('會員資料更新成功！');
          await loadMembers(currentPage);
      } else {
          showErrorMessage(result.message || '更新會員失敗');
      }

  } catch (error) {
      console.error('更新會員錯誤:', error);
      showErrorMessage('更新會員時發生錯誤');
  }
}

/**
 * 刪除會員
 */
async function deleteMember(memberId, memberName) {
  try {
      const result = await Swal.fire({
          title: '確認刪除',
          text: `確定要刪除會員「${memberName}」嗎？此操作無法復原。`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: '確定刪除',
          cancelButtonText: '取消'
      });

      if (result.isConfirmed) {
          const deleteResult = await callAPI('deleteMember', { id: memberId });

          if (deleteResult.success) {
              showSuccessMessage('會員刪除成功！');
              await loadMembers(currentPage);
          } else {
              showErrorMessage(deleteResult.message || '刪除會員失敗');
          }
      }

  } catch (error) {
      console.error('刪除會員錯誤:', error);
      showErrorMessage('刪除會員時發生錯誤');
  }
}

/**
 * 檢視會員詳情
 */
function viewMemberDetails(memberId) {
  const member = membersData.find(m => m['ID'] === memberId);
  if (!member) {
      showErrorMessage('找不到會員資料');
      return;
  }

  Swal.fire({
      title: `會員詳情 - ${member['姓名']}`,
      html: `
          <div class="text-start">
              <table class="table table-borderless">
                  <tr><td><strong>姓名：</strong></td><td>${member['姓名'] || '-'}</td></tr>
                  <tr><td><strong>電話：</strong></td><td>${member['電話'] || '-'}</td></tr>
                  <tr><td><strong>電子郵件：</strong></td><td>${member['電子郵件'] || '-'}</td></tr>
                  <tr><td><strong>地址：</strong></td><td>${member['地址'] || '-'}</td></tr>
                  <tr><td><strong>會員類型：</strong></td><td>${member['會員類型'] || '一般會員'}</td></tr>
                  <tr><td><strong>加入日期：</strong></td><td>${formatDate(member['加入日期'])}</td></tr>
                  <tr><td><strong>狀態：</strong></td><td>${member['是否啟用'] ? '啟用' : '停用'}</td></tr>
                  <tr><td><strong>備註：</strong></td><td>${member['備註'] || '-'}</td></tr>
              </table>
          </div>
      `,
      width: 600,
      confirmButtonText: '關閉'
  });
}

/**
 * 匯出會員資料
 */
async function exportMembers() {
  try {
      const result = await callAPI('exportData', {
          dataType: 'members',
          format: 'csv'
      });

      if (result.success && result.data) {
          // 建立下載連結
          const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `會員資料_${getCurrentDateString()}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showSuccessMessage('會員資料匯出成功！');
      } else {
          showErrorMessage(result.message || '匯出失敗');
      }

  } catch (error) {
      console.error('匯出會員錯誤:', error);
      showErrorMessage('匯出會員資料時發生錯誤');
  }
}

/**
 * 重新整理儀表板
 */
async function refreshDashboard() {
  showSuccessMessage('正在重新整理...');
  await showDashboard();
  showSuccessMessage('儀表板已更新！');
}

/**
 * 檢查系統健康狀態
 */
async function checkSystemHealth() {
  try {
      const result = await callAPI('systemHealthCheck', {}, false);
      
      if (!result.success) {
          console.warn('系統健康檢查失敗:', result.message);
      }

  } catch (error) {
      console.error('系統健康檢查錯誤:', error);
  }
}

/**
 * 切換內容區域
 */
function switchContent(sectionId) {
  // 隱藏所有內容區域
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
      section.style.display = 'none';
  });

  // 顯示指定區域
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
      targetSection.style.display = 'block';
  }

  currentModule = sectionId;
}

/**
 * 更新導航狀態
 */
function updateNavigation(activeSection) {
  // 移除所有 active 類別
  const navLinks = document.querySelectorAll('.sidebar .nav-link');
  navLinks.forEach(link => {
      link.classList.remove('active');
  });

  // 根據區域添加 active 類別
  const sectionMap = {
      'dashboard': 0,
      'members': 1,
      'income': 2,
      'expenses': 3,
      'bankAccounts': 4,
      'receipts': 5,
      'reports': 6,
      'accounts': 7,
      'systemManagement': 8
  };

  const activeIndex = sectionMap[activeSection];
  if (activeIndex !== undefined && navLinks[activeIndex]) {
      navLinks[activeIndex].classList.add('active');
  }
}

/**
 * 顯示收入管理
 */
function showIncome() {
  switchContent('income');
  updateNavigation('income');
  // TODO: 實作收入管理功能
}

/**
 * 顯示支出管理
 */
function showExpenses() {
  switchContent('expenses');
  updateNavigation('expenses');
  // TODO: 實作支出管理功能
}

/**
 * 顯示銀行帳戶
 */
function showBankAccounts() {
  switchContent('bankAccounts');
  updateNavigation('bankAccounts');
  // TODO: 實作銀行帳戶管理功能
}

/**
 * 顯示電子收據
 */
function showReceipts() {
  switchContent('receipts');
  updateNavigation('receipts');
  // TODO: 實作電子收據管理功能
}

/**
 * 顯示報表分析
 */
function showReports() {
  switchContent('reports');
  updateNavigation('reports');
  // TODO: 實作報表分析功能
}

/**
 * 顯示會計科目
 */
function showAccounts() {
  switchContent('accounts');
  updateNavigation('accounts');
  // TODO: 實作會計科目管理功能
}

/**
 * 顯示系統管理
 */
function showSystemManagement() {
  switchContent('systemManagement');
  updateNavigation('systemManagement');
  // TODO: 實作系統管理功能
}

/**
 * 顯示系統設定
 */
function showSystemSettings() {
  Swal.fire({
      title: '系統設定',
      text: '系統設定功能開發中...',
      icon: 'info',
      confirmButtonText: '確定'
  });
}

/**
 * 顯示個人資料
 */
function showProfile() {
  Swal.fire({
      title: '個人資料',
      text: '個人資料功能開發中...',
      icon: 'info',
      confirmButtonText: '確定'
  });
}

/**
 * 登出
 */
function logout() {
  Swal.fire({
      title: '確認登出',
      text: '確定要登出系統嗎？',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '確定登出',
      cancelButtonText: '取消'
  }).then((result) => {
      if (result.isConfirmed) {
          // TODO: 實作登出邏輯
          showSuccessMessage('已登出系統');
      }
  });
}

/**
 * 設置表單驗證
 */
function setupFormValidation() {
  // 電話號碼格式驗證
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
      input.addEventListener('blur', function() {
          const phonePattern = /^[\d\-\(\)\+\s]+$/;
          if (this.value && !phonePattern.test(this.value)) {
              this.setCustomValidity('請輸入有效的電話號碼');
          } else {
              this.setCustomValidity('');
          }
      });
  });

  // 電子郵件格式驗證
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
      input.addEventListener('blur', function() {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (this.value && !emailPattern.test(this.value)) {
              this.setCustomValidity('請輸入有效的電子郵件地址');
          } else {
              this.setCustomValidity('');
          }
      });
  });
}

// ==================== 工具函數 ====================

/**
 * 格式化貨幣
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
      return `${CONFIG.CURRENCY_SYMBOL} 0`;
  }
  
  return `${CONFIG.CURRENCY_SYMBOL} ${parseFloat(amount).toLocaleString('zh-TW', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
  })}`;
}

/**
 * 格式化日期
 */
function formatDate(dateString, format = 'yyyy/MM/dd') {
  if (!dateString) return '-';
  
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      switch (format) {
          case 'yyyy/MM/dd':
              return `${year}/${month}/${day}`;
          case 'yyyy-MM-dd':
              return `${year}-${month}-${day}`;
          case 'MM/dd':
              return `${month}/${day}`;
          default:
              return `${year}/${month}/${day}`;
      }
  } catch (error) {
      return '-';
  }
}

/**
 * 獲取當前日期字串
 */
function getCurrentDateString() {
  return formatDate(new Date(), 'yyyy-MM-dd');
}

/**
 * 獲取會員類型徽章樣式
 */
function getMemberTypeBadgeClass(memberType) {
  switch (memberType) {
      case '榮譽會員':
          return 'bg-warning text-dark';
      case '贊助會員':
          return 'bg-success';
      case '一般會員':
      default:
          return 'bg-primary';
  }
}

/**
 * 獲取狀態徽章
 */
function getStatusBadge(status) {
  switch (status) {
      case '已核准':
          return '<span class="badge bg-success">已核准</span>';
      case '待核准':
          return '<span class="badge bg-warning text-dark">待核准</span>';
      case '已拒絕':
          return '<span class="badge bg-danger">已拒絕</span>';
      default:
          return '<span class="badge bg-secondary">未知</span>';
  }
}

/**
 * 顯示成功訊息
 */
function showSuccessMessage(message) {
  Swal.fire({
      icon: 'success',
      title: '成功',
      text: message,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
  });
}

/**
 * 顯示錯誤訊息
 */
function showErrorMessage(message) {
  Swal.fire({
      icon: 'error',
      title: '錯誤',
      text: message,
      confirmButtonText: '確定'
  });
}

/**
 * 顯示警告訊息
 */
function showWarningMessage(message) {
  Swal.fire({
      icon: 'warning',
      title: '警告',
      text: message,
      confirmButtonText: '確定'
  });
}

/**
 * 顯示資訊訊息
 */
function showInfoMessage(message) {
  Swal.fire({
      icon: 'info',
      title: '資訊',
      text: message,
      confirmButtonText: '確定'
  });
}

/**
 * 確認對話框
 */
function showConfirmDialog(title, message, confirmText = '確定', cancelText = '取消') {
  return Swal.fire({
      title: title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true
  });
}

/**
 * 複製到剪貼板
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
      showSuccessMessage('已複製到剪貼板');
  }).catch(() => {
      showErrorMessage('複製失敗');
  });
}

/**
 * 下載檔案
 */
function downloadFile(data, filename, type = 'text/plain') {
  const blob = new Blob([data], { type: type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 驗證表單
 */
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
      if (!field.value.trim()) {
          field.classList.add('is-invalid');
          isValid = false;
      } else {
          field.classList.remove('is-invalid');
      }
  });
  
  return isValid;
}

/**
 * 清除表單驗證狀態
 */
function clearFormValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const fields = form.querySelectorAll('.is-invalid');
  fields.forEach(field => {
      field.classList.remove('is-invalid');
  });
}

/**
 * 生成隨機ID
 */
function generateRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 防抖處理
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
      const later = () => {
          timeout = null;
          if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
  };
}

/**
 * 節流處理
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
      if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
      }
  };
}

/**
 * 深拷貝物件
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
              clonedObj[key] = deepClone(obj[key]);
          }
      }
      return clonedObj;
  }
}

/**
 * 檢查是否為手機裝置
 */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 滾動到頂部
 */
function scrollToTop() {
  window.scrollTo({
      top: 0,
      behavior: 'smooth'
  });
}

/**
 * 本地儲存工具
 */
const LocalStorage = {
  set(key, value) {
      try {
          localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
          console.error('LocalStorage set error:', error);
      }
  },
  
  get(key, defaultValue = null) {
      try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
          console.error('LocalStorage get error:', error);
          return defaultValue;
      }
  },
  
  remove(key) {
      try {
          localStorage.removeItem(key);
      } catch (error) {
          console.error('LocalStorage remove error:', error);
      }
  },
  
  clear() {
      try {
          localStorage.clear();
      } catch (error) {
          console.error('LocalStorage clear error:', error);
      }
  }
};

/**
 * 會話儲存工具
 */
const SessionStorage = {
  set(key, value) {
      try {
          sessionStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
          console.error('SessionStorage set error:', error);
      }
  },
  
  get(key, defaultValue = null) {
      try {
          const item = sessionStorage.getItem(key);
          return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
          console.error('SessionStorage get error:', error);
          return defaultValue;
      }
  },
  
  remove(key) {
      try {
          sessionStorage.removeItem(key);
      } catch (error) {
          console.error('SessionStorage remove error:', error);
      }
  },
  
  clear() {
      try {
          sessionStorage.clear();
      } catch (error) {
          console.error('SessionStorage clear error:', error);
      }
  }
};

// ==================== 初始化樣式 ====================

// 添加額外的CSS樣式
const additionalStyles = `
  <style>
      .avatar-circle {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
      }
      
      .content-section {
          animation: fadeIn 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      
      .table-hover tbody tr:hover {
          background-color: rgba(44, 90, 160, 0.05);
      }
      
      .action-buttons .btn {
          transition: all 0.2s ease;
      }
      
      .action-buttons .btn:hover {
          transform: scale(1.1);
      }
      
      .search-box {
          position: relative;
      }
      
      .search-box .fa-search {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          z-index: 10;
      }
      
      .search-box input {
          padding-left: 40px;
      }
      
      .modal-content {
          border-radius: 15px;
          border: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }
      
      .swal2-popup {
          border-radius: 15px;
      }
      
      .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
      }
      
      .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
      }
      
      @media (max-width: 768px) {
          .stats-card {
              margin-bottom: 15px;
          }
          
          .table-responsive {
              font-size: 14px;
          }
          
          .action-buttons .btn {
              padding: 3px 8px;
              font-size: 12px;
          }
          
          .modal-dialog {
              margin: 10px;
          }
      }
      
      /* 自訂滾動條 */
      ::-webkit-scrollbar {
          width: 8px;
      }
      
      ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb {
          background: var(--primary-color);
          border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
          background: var(--secondary-color);
      }
  </style>
`;

// 將樣式添加到頁面
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// ==================== 全域錯誤處理 ====================

window.addEventListener('error', function(event) {
  console.error('全域錯誤:', event.error);
  showErrorMessage('系統發生未預期的錯誤，請重新整理頁面或聯繫管理員');
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('未處理的Promise拒絕:', event.reason);
  showErrorMessage('系統發生錯誤，請稍後再試');
});

// ==================== 性能監控 ====================

// 監控頁面載入時間
window.addEventListener('load', function() {
  const loadTime = performance.now();
  console.log(`頁面載入時間: ${loadTime.toFixed(2)}ms`);
  
  if (loadTime > 3000) {
      console.warn('頁面載入時間過長，建議優化');
  }
});

// 監控API回應時間
const originalCallAPI = callAPI;
window.callAPI = async function(action, data = {}, showLoading = true) {
  const startTime = performance.now();
  const result = await originalCallAPI(action, data, showLoading);
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`API ${action} 回應時間: ${duration.toFixed(2)}ms`);
  
  if (duration > 5000) {
      console.warn(`API ${action} 回應時間過長: ${duration.toFixed(2)}ms`);
  }
  
  return result;
};

console.log('🚀 非營利組織財務管理系統前端已載入完成');