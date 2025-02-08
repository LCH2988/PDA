// app.js

// 全域狀態管理
const state = {
    userId: null,
    csrfToken: null,
    profile: null
};

// UI 元素管理
const UI = {
    loading: document.getElementById('loading'),
    profileImage: document.getElementById('profileImage'),
    displayName: document.getElementById('displayName'),
    loginCount: document.getElementById('loginCount'),
    profileForm: document.getElementById('profileForm'),
    
    showLoading(show = true) {
        this.loading.classList.toggle('active', show);
    },

    showError(title, message) {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonText: '確定'
        });
    },

    showSuccess(title, message) {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            confirmButtonText: '確定'
        });
    },

    updateProfile(profile) {
        this.profileImage.src = profile.pictureUrl || 'https://via.placeholder.com/100';
        this.displayName.textContent = profile.displayName || '未知用戶';
        this.loginCount.textContent = `登入次數: ${profile.loginCount || 0}`;

        // 更新表單資料
        const form = this.profileForm;
        Object.entries(profile).forEach(([key, value]) => {
            const input = form.elements[key];
            if (input && value) {
                input.value = value;
            }
        });
    }
};

// API 服務
const API = {
    async request(action, data = {}) {
        try {
            const payload = {
                ...data,
                action,
                csrfToken: state.csrfToken
            };

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('網路請求失敗');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || '請求失敗');
            }

            return result;
        } catch (error) {
            console.error('API 請求失敗:', error);
            throw error;
        }
    },

    async recordLogin(data) {
        return this.request('recordLogin', data);
    },

    async getUserProfile() {
        return this.request('getUserProfile', { userId: state.userId });
    },

    async updateProfile(data) {
        return this.request('updateProfile', {
            ...data,
            userId: state.userId
        });
    }
};

// 表單驗證
const FormValidator = {
    patterns: {
        phone: /^09\d{8}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        idNumber: /^[A-Z][12]\d{8}$/
    },

    validateField(input) {
        const errorDiv = input.nextElementSibling;
        let isValid = true;
        let errorMessage = '';

        if (input.required && !input.value) {
            isValid = false;
            errorMessage = '此欄位為必填';
        } else if (input.pattern && !new RegExp(input.pattern).test(input.value)) {
            isValid = false;
            errorMessage = '格式不正確';
        }

        input.classList.toggle('is-invalid', !isValid);
        errorDiv.classList.toggle('show', !isValid);
        errorDiv.textContent = errorMessage;

        return isValid;
    },

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    },

    setupValidation(form) {
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateField(input));
            input.addEventListener('blur', () => this.validateField(input));
        });
    }
};

// 應用程式初始化
async function initializeApp() {
    try {
        UI.showLoading(true);

        // 初始化 LIFF
        await liff.init({ liffId: CONFIG.LIFF_ID });
        
        // 檢查登入狀態
        if (!liff.isLoggedIn()) {
            await liff.login();
            return;
        }

        // 獲取用戶資料
        const profile = await liff.getProfile();
        state.userId = profile.userId;

        // 記錄登入
        const loginResult = await API.recordLogin({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            statusMessage: profile.statusMessage,
            os: liff.getOS(),
            language: liff.getLanguage(),
            version: liff.getVersion(),
            lineVersion: liff.getLineVersion(),
            isInClient: liff.isInClient(),
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
        });

        // 儲存 CSRF Token
        state.csrfToken = loginResult.csrfToken;

        // 載入用戶資料
        const userProfile = await API.getUserProfile();
        state.profile = userProfile.profile;

        // 更新 UI
        UI.updateProfile(state.profile);

        // 設定表單驗證
        FormValidator.setupValidation(UI.profileForm);

        // 處理表單提交
        UI.profileForm.addEventListener('submit', handleFormSubmit);

    } catch (error) {
        console.error('初始化失敗:', error);
        await UI.showError('初始化失敗', 
            CONFIG.DEBUG ? error.message : '請重新整理頁面後再試');
    } finally {
        UI.showLoading(false);
    }
}

// 表單提交處理
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!FormValidator.validateForm(event.target)) {
        return;
    }

    try {
        UI.showLoading(true);

        const formData = new FormData(event.target);
        const profileData = Object.fromEntries(formData.entries());

        await API.updateProfile(profileData);
        await UI.showSuccess('更新成功', '您的個人資料已更新');

    } catch (error) {
        console.error('更新失敗:', error);
        await UI.showError('更新失敗', 
            CONFIG.DEBUG ? error.message : '請稍後再試');
    } finally {
        UI.showLoading(false);
    }
}

// 錯誤處理
window.addEventListener('error', (event) => {
    console.error('全域錯誤:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的 Promise 錯誤:', event.reason);
});

// 啟動應用程式
document.addEventListener('DOMContentLoaded', initializeApp);
