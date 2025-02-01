const CONFIG = {
  // API 設定
  API: {
    GAS_URL: 'https://script.google.com/macros/s/你的部署ID/exec',
    LIFF_ID: '你的LIFF ID',
  },
  
  // 活動相關設定
  EVENT: {
    MAX_PARTICIPANTS: 4,      // 每次報名最多人數
    MIN_PARTICIPANTS: 1,      // 每次報名最少人數
    MEAL_OPTIONS: [          // 餐點選項
      { value: 'normal', label: '一般餐' },
      { value: 'vegetarian', label: '素食' },
      { value: 'halal', label: '清真餐' }
    ]
  },
  
  // 表單驗證規則
  VALIDATION: {
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 20,
      PATTERN: /^[\u4e00-\u9fa5a-zA-Z\s]{2,20}$/
    },
    NOTE: {
      MAX_LENGTH: 100
    }
  },
  
  // UI 相關設定
  UI: {
    TOAST_DURATION: 5000,    // 提示訊息顯示時間（毫秒）
    DATE_FORMAT: 'YYYY/MM/DD HH:mm',
    THEME: {
      PRIMARY_COLOR: 'blue',
      SECONDARY_COLOR: 'gray'
    }
  },
  
  // 系統訊息
  MESSAGES: {
    ERRORS: {
      FETCH_FAILED: '載入活動失敗',
      SUBMIT_FAILED: '報名失敗',
      LIFF_INIT_FAILED: 'LIFF 初始化失敗',
      INVALID_NAME: '姓名格式不正確（請輸入 2-20 個中文或英文字）',
      INVALID_COUNT: '報名人數超出限制',
    },
    SUCCESS: {
      REGISTRATION: '報名成功！',
    },
    LOADING: {
      EVENTS: '載入活動中...',
      SUBMITTING: '送出報名中...'
    }
  }
};
