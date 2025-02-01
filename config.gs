// 系統設定
const SYSTEM_CONFIG = {
  // 試算表設定
  SPREADSHEET: {
    EVENTS_SHEET_NAME: '活動清單',
    REGISTRATIONS_SHEET_NAME: '報名資料',
    LOGS_SHEET_NAME: '系統記錄',
  },
  
  // 活動設定
  EVENT: {
    STATUS: {
      OPEN: '開放報名',
      CLOSED: '已結束',
      FULL: '名額已滿'
    },
    COLUMNS: {
      ID: 'A',
      NAME: 'B',
      DATE: 'C',
      LOCATION: 'D',
      CAPACITY: 'E',
      REGISTERED: 'F',
      STATUS: 'G',
      FORM_TYPE: 'H',
      DESCRIPTION: 'I'
    }
  },
  
  // 報名資料設定
  REGISTRATION: {
    COLUMNS: {
      TIMESTAMP: 'A',
      EVENT_ID: 'B',
      LINE_USER_ID: 'C',
      LINE_DISPLAY_NAME: 'D',
      PARTICIPANT_NAME: 'E',
      MEAL_PREFERENCE: 'F',
      NOTE: 'G'
    }
  },
  
  // 系統記錄設定
  LOGGING: {
    LEVELS: {
      INFO: 'INFO',
      WARNING: 'WARNING',
      ERROR: 'ERROR'
    },
    COLUMNS: {
      TIMESTAMP: 'A',
      LEVEL: 'B',
      EVENT: 'C',
      MESSAGE: 'D',
      DATA: 'E'
    }
  },
  
  // 快取設定
  CACHE: {
    DURATION: 300, // 5分鐘
    KEYS: {
      EVENTS: 'events_cache',
      EVENT_PREFIX: 'event_'
    }
  },
  
  // API 回應設定
  API: {
    STATUS_CODES: {
      SUCCESS: 200,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      NOT_FOUND: 404,
      SERVER_ERROR: 500
    },
    CORS: {
      ALLOWED_ORIGINS: ['*'],
      ALLOWED_METHODS: ['GET', 'POST', 'OPTIONS'],
      ALLOWED_HEADERS: ['Content-Type']
    }
  }
};

// 驗證規則
const VALIDATION_RULES = {
  EVENT: {
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50
    },
    CAPACITY: {
      MIN: 1,
      MAX: 200
    }
  },
  REGISTRATION: {
    PARTICIPANT: {
      NAME: {
        MIN_LENGTH: 2,
        MAX_LENGTH: 20,
        PATTERN: /^[\u4e00-\u9fa5a-zA-Z\s]{2,20}$/
      },
      NOTE: {
        MAX_LENGTH: 100
      }
    }
  }
};

// 錯誤訊息
const ERROR_MESSAGES = {
  INVALID_ACTION: '無效的操作類型',
  EVENT_NOT_FOUND: '找不到指定的活動',
  EVENT_CLOSED: '活動已結束報名',
  EVENT_FULL: '活動名額已滿',
  INVALID_PARTICIPANT_COUNT: '報名人數超出限制',
  INVALID_NAME_FORMAT: '姓名格式不正確',
  SYSTEM_ERROR: '系統發生錯誤，請稍後再試'
};
