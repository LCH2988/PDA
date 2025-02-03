// LIFF ID 設定
const LIFF_ID = '2001679903-r5VXNe5g';

// GAS Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxN4QcgMW1SjjqyPX3dE2Hf9DJaXExjLDwiS9C2YeUNNixGu-iX78b8T2-0zvTMs36y/exec';


// 初始化 LIFF
async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });
        
        // 檢查是否已登入
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        // 獲取使用者資料
        const profile = await liff.getProfile();
        await saveUserData(profile);
        
        // 檢查基本資料是否完整
        const userData = await checkUserProfile(profile.userId);
        
        if (!userData.isProfileComplete) {
            // 導向個人資料填寫頁面
            showProfileForm();
        } else {
            // 導向活動列表
            showEventList();
        }

        // 顯示主要內容
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
        // 設置使用者資訊
        document.getElementById('user-name').textContent = profile.displayName;
        document.getElementById('user-picture').src = profile.pictureUrl;

        // 檢查是否為管理員
        const isAdmin = await checkAdminStatus(profile.userId);
        if (isAdmin) {
            document.getElementById('admin-menu').classList.remove('d-none');
        }

    } catch (err) {
        console.error('LIFF 初始化失敗', err);
    }
}

// 儲存使用者資料
async function saveUserData(profile) {
    const data = {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(`${GAS_URL}?action=saveUser`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (err) {
        console.error('儲存使用者資料失敗', err);
    }
}

// 檢查使用者檔案完整性
async function checkUserProfile(userId) {
    try {
        const response = await fetch(`${GAS_URL}?action=checkProfile&userId=${userId}`);
        return await response.json();
    } catch (err) {
        console.error('檢查使用者檔案失敗', err);
        return { isProfileComplete: false };
    }
}

// 頁面載入時初始化 LIFF
window.onload = initializeLiff;
