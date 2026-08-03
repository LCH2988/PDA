import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, Pill, Clock, Calendar, FileText, User, AlertCircle, 
  Play, Sparkles, Download, CheckCircle, RefreshCw, Mic, MicOff,
  ChevronRight, Volume2, ShieldCheck, Heart, BarChart2, Plus, Trash2, Printer,
  Smile, Award, TrendingUp, Flame, Sun, Zap, Coffee, HeartPulse, HelpCircle, Upload, Save,
  VolumeX, Music, Sparkle, Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const INITIAL_LOGS = [
  { id: '1', timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 3600000 * 8).toISOString(), type: 'med', title: '服藥：美多芭 (Madopar)', note: '早餐後服藥', tapScore: null, mood: '😊' },
  { id: '2', timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 3600000 * 9).toISOString(), type: 'on', title: '狀態：藥效發揮中 (On)', note: '精神很好，去散步 20 分鐘', tapScore: 42, mood: '🌈' },
  { id: '3', timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 3600000 * 12).toISOString(), type: 'off', title: '狀態：藥效退去 (Off)', note: '腳步略顯沉重', tapScore: 20, mood: '🐢' },
  { id: '4', timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 3600000 * 8).toISOString(), type: 'med', title: '服藥：美多芭 (Madopar)', note: '準時服用', tapScore: null, mood: '😊' },
  { id: '5', timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 3600000 * 10).toISOString(), type: 'on', title: '狀態：藥效發揮中 (On)', note: '做關節伸展運動', tapScore: 39, mood: '💪' },
  { id: '6', timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 3600000 * 16).toISOString(), type: 'off', title: '狀態：藥效退去 (Off)', note: '傍晚僵硬感較明顯', tapScore: 18, mood: '🥱' },
  { id: '7', timestamp: new Date(Date.now() - 3600000 * 24 * 1 + 3600000 * 8).toISOString(), type: 'med', title: '服藥：美多芭 (Madopar)', note: '搭配溫開水', tapScore: null, mood: '😊' },
  { id: '8', timestamp: new Date(Date.now() - 3600000 * 24 * 1 + 3600000 * 11).toISOString(), type: 'dyskinesia', title: '狀態：不自主扭動 (Dyskinesia)', note: '頭部些許擺動', tapScore: null, mood: '⚡' },
  { id: '9', timestamp: new Date().toISOString(), type: 'on', title: '狀態：藥效發揮中 (On)', note: '剛完成敲擊測驗，動作流暢', tapScore: 45, mood: '🌟' },
];

const INITIAL_MEDS = [
  { id: 'm1', name: '美多芭 (Madopar 250mg)', time: '08:00', dosage: '1 錠' },
  { id: 'm2', name: '美多芭 (Madopar 250mg)', time: '13:00', dosage: '1 錠' },
  { id: 'm3', name: '美多芭 (Madopar 250mg)', time: '18:00', dosage: '1 錠' },
];

const WARM_TIPS = [
  "☀️ 每天早晨喝一杯溫開水，幫助腸胃蠕動與藥物吸收喔！",
  "🌸 藥效順暢（On期）是做肌肉伸展與散步的最佳黃金時間！",
  "💧 服用美多芭前，盡量避免高蛋白濃稠大餐，可讓藥效發揮得更順利！",
  "🎈 感到腳步卡卡凍結時，試著打開我們的「解凍節拍器」跟著 rhythm 1-2 跨出去！",
  "❤️ 紀錄不是為了擔心病情，而是為了幫您與醫師找回最舒適的生活節奏！",
  "🗣️ 每天堅持大聲發聲練習 5 秒鐘，能保護聲帶肌力與社交說話自信！"
];

export default function App() {
  const [logs, setLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parkinson_logs');
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    }
    return INITIAL_LOGS;
  });

  const [meds, setMeds] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parkinson_meds');
      return saved ? JSON.parse(saved) : INITIAL_MEDS;
    }
    return INITIAL_MEDS;
  });

  const [nextClinicDate, setNextClinicDate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('parkinson_clinic_date') || '2026-08-10';
    }
    return '2026-08-10';
  });

  const [streakCount, setStreakCount] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('parkinson_streak') || '5', 10);
    }
    return 5;
  });

  const [gardenPoints, setGardenPoints] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('parkinson_garden_pts') || '35', 10);
    }
    return 35;
  });

  // 頁籤狀態：'patient' | 'analytics' | 'rehab' | 'doctor' | 'meds'
  const [activeTab, setActiveTab] = useState('patient');
  
  // 趣味互動狀態
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [selectedMood, setSelectedMood] = useState('😊');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSpeakingTip, setIsSpeakingTip] = useState(false);

  // 語音輸入與 AI 狀態
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiNotice, setAiNotice] = useState('');

  // 新增藥物表單狀態
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [newMedDosage, setNewMedDosage] = useState('1 錠');

  // 敲擊測試狀態
  const [tapTestActive, setTapTestActive] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeLeft, setTapTimeLeft] = useState(10);
  const [lastTapHand, setLastTapHand] = useState(null);
  const tapTimerRef = useRef<any>(null);

  // 解凍節拍器 (Metronome) 狀態
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [bpm, setBpm] = useState(90);
  const [metronomeBeat, setMetronomeBeat] = useState(1);
  const metronomeIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 發聲長音測試 (Vocal Exercise) 狀態
  const [vocalTesting, setVocalTesting] = useState(false);
  const [vocalVolume, setVocalVolume] = useState(0);
  const [vocalScore, setVocalScore] = useState(0);
  const [vocalTimeLeft, setVocalTimeLeft] = useState(5);
  const vocalAudioCtxRef = useRef<any>(null);
  const vocalTimerRef = useRef<any>(null);

  // Toast 訊息
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('parkinson_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('parkinson_meds', JSON.stringify(meds));
  }, [meds]);

  useEffect(() => {
    localStorage.setItem('parkinson_clinic_date', nextClinicDate);
  }, [nextClinicDate]);

  useEffect(() => {
    localStorage.setItem('parkinson_streak', streakCount.toString());
  }, [streakCount]);

  useEffect(() => {
    localStorage.setItem('parkinson_garden_pts', gardenPoints.toString());
  }, [gardenPoints]);

  const showToast = (msg: string) => {
    setModalMessage(msg);
    setTimeout(() => {
      setModalMessage(null);
    }, 2800);
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setGardenPoints(prev => prev + 5);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % WARM_TIPS.length);
  };

  const speakTip = () => {
    if (!('speechSynthesis' in window)) {
      showToast('⚠️ 您的瀏覽器不支援語音合成朗讀');
      return;
    }
    if (isSpeakingTip) {
      window.speechSynthesis.cancel();
      setIsSpeakingTip(false);
      return;
    }

    const text = WARM_TIPS[currentTipIndex].replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.9; // 稍微放慢語速適合長者
    utterance.onend = () => setIsSpeakingTip(false);
    utterance.onerror = () => setIsSpeakingTip(false);
    
    setIsSpeakingTip(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleQuickLog = (type: string, title: string, defaultNote = '') => {
    if (navigator.vibrate) navigator.vibrate(50);

    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      title,
      note: defaultNote || '手動快速紀錄',
      tapScore: null,
      mood: selectedMood
    };

    setLogs(prev => [newLog, ...prev]);
    showToast(`❤️ 小舒記下來囉！：${title} ${selectedMood}`);
    triggerCelebration();
  };

  const toggleMetronome = () => {
    if (metronomeActive) {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
      setMetronomeActive(false);
    } else {
      setMetronomeActive(true);
      const intervalMs = (60 / bpm) * 1000;
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;

      metronomeIntervalRef.current = setInterval(() => {
        setMetronomeBeat(b => (b === 1 ? 2 : 1));
        
        // 發出規律嗶嗶聲
        try {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}

        if (navigator.vibrate) navigator.vibrate(30);
      }, intervalMs);
    }
  };

  useEffect(() => {
    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, []);

  const startVocalTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      vocalAudioCtxRef.current = { audioCtx, stream };
      setVocalTesting(true);
      setVocalTimeLeft(5);
      setVocalScore(0);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let totalVol = 0;
      let count = 0;

      const checkVolume = () => {
        if (!vocalAudioCtxRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setVocalVolume(Math.min(100, Math.round((average / 128) * 100)));
        totalVol += average;
        count++;

        requestAnimationFrame(checkVolume);
      };
      requestAnimationFrame(checkVolume);

      vocalTimerRef.current = setInterval(() => {
        setVocalTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(vocalTimerRef.current);
            stopVocalTest(totalVol / (count || 1));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      showToast('⚠️ 請允許麥克風權限以進行發聲測試');
    }
  };

  const stopVocalTest = (avgVol: number) => {
    setVocalTesting(false);
    if (vocalAudioCtxRef.current) {
      vocalAudioCtxRef.current.stream.getTracks().forEach((t: any) => t.stop());
      vocalAudioCtxRef.current.audioCtx.close();
      vocalAudioCtxRef.current = null;
    }
    const score = Math.round((avgVol / 128) * 100);
    setVocalScore(score);

    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'on',
      title: '5秒大聲發聲練習 (LSVT LOUD)',
      note: `發聲強度得分：${score} 分`,
      tapScore: null,
      mood: '🗣️'
    };
    setLogs(prev => [newLog, ...prev]);
    showToast(`🗣️ 發聲練習完成！獲得 ${score} 分響亮指數！`);
    triggerCelebration();
  };

  const handleStartVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('⚠️ 您的瀏覽器不支援語音辨識，請直接文字輸入描述喔！');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      showToast('語音辨識稍微迷路了，請再試一次喔！');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSpeechText(transcript);
      processVoiceWithAI(transcript);
    };

    recognition.start();
  };

  // 模擬 AI 或規則解析（在沒有 API Key 的情況下提供完美體驗）
  const processVoiceWithAI = async (text: string) => {
    setIsProcessingAI(true);
    setAiNotice('🤖 小舒正在認真聽懂您的話語並整理中...');

    // 模擬 1.2 秒的 AI 處理時間
    setTimeout(() => {
      let type = 'symptom';
      let title = '口述健康紀錄';
      let note = text;

      const lowerText = text.toLowerCase();
      if (lowerText.includes('吃藥') || lowerText.includes('服藥') || lowerText.includes('美多芭')) {
        type = 'med';
        title = '服藥：巴金森藥物';
        note = `口述服藥：${text}`;
      } else if (lowerText.includes('舒服') || lowerText.includes('順暢') || lowerText.includes('靈活') || lowerText.includes('好多了')) {
        type = 'on';
        title = '狀態：藥效發揮中 (On)';
        note = `口述體感：${text}`;
      } else if (lowerText.includes('僵硬') || lowerText.includes('卡住') || lowerText.includes('退藥') || lowerText.includes('走不動')) {
        type = 'off';
        title = '狀態：藥效退去 (Off)';
        note = `口述體感：${text}`;
      } else if (lowerText.includes('抖') || lowerText.includes('扭動') || lowerText.includes('不自主')) {
        type = 'dyskinesia';
        title = '狀態：不自主扭動 (Dyskinesia)';
        note = `口述體感：${text}`;
      }

      const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type,
        title,
        note,
        tapScore: null,
        mood: selectedMood
      };

      setLogs(prev => [newLog, ...prev]);
      setSpeechText('');
      setAiNotice('');
      setIsProcessingAI(false);
      showToast(`✨ 小舒幫您完成紀錄：${title}`);
      triggerCelebration();
    }, 1200);
  };

  const startTapTest = () => {
    setTapTestActive(true);
    setTapCount(0);
    setTapTimeLeft(10);
    setLastTapHand(null);

    tapTimerRef.current = setInterval(() => {
      setTapTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(tapTimerRef.current);
          endTapTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const registerTap = (hand: 'L' | 'R') => {
    if (!tapTestActive) return;
    if (hand !== lastTapHand) {
      setTapCount(c => c + 1);
      setLastTapHand(hand);
      if (navigator.vibrate) navigator.vibrate(25);
    }
  };

  const endTapTest = () => {
    setTapTestActive(false);
    setTimeout(() => {
      setTapCount(finalCount => {
        const newLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'on',
          title: '手指敲擊靈巧度測驗',
          note: `10 秒內完成 ${finalCount} 次雙手交替點擊 (${(finalCount / 10).toFixed(1)} 次/秒)`,
          tapScore: finalCount,
          mood: '💪'
        };
        setLogs(prev => [newLog, ...prev]);
        showToast(`🎉 太棒了！挑戰成功！得分：${finalCount} 次`);
        triggerCelebration();
        return finalCount;
      });
    }, 100);
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) {
      showToast('⚠️ 請輸入藥物名稱');
      return;
    }
    const newMed = {
      id: 'm_' + Date.now(),
      name: newMedName,
      time: newMedTime,
      dosage: newMedDosage
    };
    setMeds(prev => [...prev, newMed].sort((a, b) => a.time.localeCompare(b.time)));
    setNewMedName('');
    showToast(`💊 已成功排定藥物：${newMedName}`);
  };

  const handleDeleteMed = (id: string) => {
    setMeds(prev => prev.filter(m => m.id !== id));
    showToast('🗑️ 藥物已從時間表中移除');
  };

  const exportDataJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ logs, meds, nextClinicDate, gardenPoints }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ParkinsonCare_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 備份檔案已順利下載！');
  };

  const analyticsData = useMemo(() => {
    let onCount = 0;
    let offCount = 0;
    let dysCount = 0;
    let medCount = 0;

    const hourlyOffMap = Array.from({ length: 24 }).fill(0);
    const hourlyOnMap = Array.from({ length: 24 }).fill(0);

    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (log.type === 'on') { onCount++; hourlyOnMap[hour]++; }
      if (log.type === 'off') { offCount++; hourlyOffMap[hour]++; }
      if (log.type === 'dyskinesia') dysCount++;
      if (log.type === 'med') medCount++;
    });

    const totalStatus = onCount + offCount + dysCount || 1;
    const onPercent = Math.round((onCount / totalStatus) * 100);
    const offPercent = Math.round((offCount / totalStatus) * 100);
    const dysPercent = Math.round((dysCount / totalStatus) * 100);

    const pieData = [
      { name: '藥效順暢 (On)', value: onCount || 1, color: '#10B981' },
      { name: '藥效退去 (Off)', value: offCount, color: '#F43F5E' },
      { name: '異動扭動 (Dyskinesia)', value: dysCount, color: '#F59E0B' },
    ].filter(d => d.value > 0);

    const hourlyTrendData = [];
    for (let h = 7; h <= 21; h++) {
      hourlyTrendData.push({
        time: `${h.toString().padStart(2, '0')}:00`,
        On: hourlyOnMap[h] || 0,
        Off: hourlyOffMap[h] || 0,
      });
    }

    const tapHistory = logs
      .filter(l => l.tapScore !== null)
      .reverse()
      .map(l => ({
        date: new Date(l.timestamp).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit' }),
        score: l.tapScore
      }));

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
      
      const dayLogs = logs.filter(l => {
        const logD = new Date(l.timestamp);
        return logD.getDate() === d.getDate() && logD.getMonth() === d.getMonth();
      });

      return {
        date: dateStr,
        On: dayLogs.filter(l => l.type === 'on').length,
        Off: dayLogs.filter(l => l.type === 'off').length,
        Dyskinesia: dayLogs.filter(l => l.type === 'dyskinesia').length,
        服藥數: dayLogs.filter(l => l.type === 'med').length,
      };
    });

    return {
      onPercent,
      offPercent,
      dysPercent,
      medCount,
      pieData,
      hourlyTrendData,
      tapHistory,
      last7Days
    };
  }, [logs]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col relative selection:bg-teal-500 selection:text-white pb-12">
      
      {/* 歡慶特效 Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce bg-slate-950/80 p-6 rounded-full border-4 border-amber-400 shadow-2xl">
            ✨ 🌸 🌻 👏 🌟
          </div>
        </div>
      )}

      {/* Toast 提示訊息 Modal */}
      {modalMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-teal-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-base flex items-center space-x-2 animate-bounce border-2 border-teal-300">
          <span>{modalMessage}</span>
        </div>
      )}

      {/* 頂部 Header */}
      <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-teal-500 via-emerald-400 to-amber-300 rounded-2xl shadow-lg flex items-center justify-center">
              <Smile className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-wide">巴金森舒心健康紀錄</h1>
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30 flex items-center">
                  <Flame className="w-3.5 h-3.5 mr-1 text-amber-400 fill-amber-400" />
                  連續 {streakCount} 天
                </span>
              </div>
              <p className="text-xs text-teal-400 font-medium">暖心陪伴・簡單紀錄・醫病溝通無障礙</p>
            </div>
          </div>

          {/* 模式切換按鈕組 */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-700 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('patient')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                activeTab === 'patient' 
                  ? 'bg-teal-500 text-slate-950 shadow-md font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>👴 病友大鈕</span>
            </button>

            <button
              onClick={() => setActiveTab('rehab')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                activeTab === 'rehab' 
                  ? 'bg-rose-500 text-white shadow-md font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>🎵 解凍與復健</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                activeTab === 'analytics' 
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>📈 身體趨勢</span>
            </button>

            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                activeTab === 'doctor' 
                  ? 'bg-emerald-400 text-slate-950 shadow-md font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>📋 門診摘要</span>
            </button>

            <button
              onClick={() => setActiveTab('meds')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                activeTab === 'meds' 
                  ? 'bg-sky-400 text-slate-950 shadow-md font-black' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>💊 服藥時間</span>
            </button>
          </div>
        </div>
      </header>

      {/* 暖心提示 */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-800 to-amber-950/40 border-b border-teal-800/40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-xl shrink-0">
              🌱
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-teal-300">小舒的話：</span>
                <span className="text-slate-200">{WARM_TIPS[currentTipIndex]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button 
              onClick={speakTip}
              className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 font-bold ${
                isSpeakingTip ? 'bg-rose-500 border-rose-400 text-white animate-pulse' : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeakingTip ? '朗讀中...' : '朗讀'}</span>
            </button>
            <button 
              onClick={nextTip}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1.5 rounded-xl border border-teal-500/30 font-bold"
            >
              換一張 🔄
            </button>
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <main className="max-w-4xl mx-auto w-full p-4 flex-1">

        {/* 病友大鈕頁籤 */}
        {activeTab === 'patient' && (
          <div className="space-y-6">

            {/* 心情花園與花朵累積小卡 */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-800 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between flex-wrap gap-3 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="text-3xl p-2 bg-emerald-900/40 rounded-2xl border border-emerald-400/30">
                  {gardenPoints > 80 ? '🌻' : gardenPoints > 50 ? '🌸' : gardenPoints > 20 ? '🌿' : '🌱'}
                </div>
                <div>
                  <h3 className="font-bold text-emerald-300 text-sm flex items-center">
                    小舒的心情療癒花園
                    <span className="ml-2 bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                      能量 {gardenPoints} pts
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    每一次點擊紀錄或測試，都能灌溉小花茁壯生長喔！
                  </p>
                </div>
              </div>
              <div className="flex space-x-1 text-2xl">
                <span>🌱</span>
                <span className={gardenPoints >= 20 ? 'opacity-100' : 'opacity-30'}>🌿</span>
                <span className={gardenPoints >= 50 ? 'opacity-100' : 'opacity-30'}>🌸</span>
                <span className={gardenPoints >= 80 ? 'opacity-100' : 'opacity-30'}>🌻</span>
                <span className={gardenPoints >= 120 ? 'opacity-100' : 'opacity-30'}>🌈</span>
              </div>
            </div>

            {/* 心情 / 體感快選 */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-teal-300 flex items-center">
                <Heart className="w-4 h-4 mr-1 text-rose-400 fill-rose-400" />
                當前體感心情：
              </span>
              <div className="flex space-x-2">
                {[
                  { emoji: '😊', label: '順暢舒服' },
                  { emoji: '🌈', label: '精神良好' },
                  { emoji: '🐢', label: '略微慢動作' },
                  { emoji: '🥱', label: '稍微疲倦' },
                  { emoji: '⚡', label: '有不自主感' },
                ].map(item => (
                  <button
                    key={item.emoji}
                    onClick={() => setSelectedMood(item.emoji)}
                    className={`px-3 py-1.5 rounded-xl text-base transition-all flex items-center space-x-1 ${
                      selectedMood === item.emoji 
                        ? 'bg-teal-500 text-slate-950 font-black ring-2 ring-teal-300 scale-105' 
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span className="text-xs hidden sm:inline">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 一鍵狀態記錄 (超大按鈕區) */}
            <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-teal-300 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-amber-400 fill-amber-400" />
                    現在感覺如何？點擊大鈕 1 秒紀錄
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">專為震顫與僵硬設計的大點擊區</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleQuickLog('on', '藥效發揮中 (On)', '感覺靈活自如')}
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all text-left flex items-start justify-between border-2 border-emerald-400/40"
                >
                  <div>
                    <span className="bg-emerald-950/60 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-400/30">
                      藥效良好
                    </span>
                    <h3 className="text-2xl font-black mt-2">🟢 藥效順暢 (On)</h3>
                    <p className="text-xs text-emerald-100 font-normal mt-1 opacity-90">身體靈活、活動輕鬆、震顫減輕</p>
                  </div>
                  <ChevronRight className="w-8 h-8 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickLog('off', '藥效退去/僵硬 (Off)', '感覺肌肉僵硬或踩不出去')}
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black shadow-lg hover:shadow-rose-500/20 active:scale-95 transition-all text-left flex items-start justify-between border-2 border-rose-400/40"
                >
                  <div>
                    <span className="bg-rose-950/60 text-rose-300 text-xs px-3 py-1 rounded-full border border-rose-400/30">
                      藥效提早退去
                    </span>
                    <h3 className="text-2xl font-black mt-2">🔴 藥效僵硬 (Off)</h3>
                    <p className="text-xs text-rose-100 font-normal mt-1 opacity-90">動作卡住、步態凍結、手腳沈重</p>
                  </div>
                  <ChevronRight className="w-8 h-8 text-rose-200 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickLog('dyskinesia', '不自主扭動 (Dyskinesia)', '手腳或身體輕微擺動')}
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all text-left flex items-start justify-between border-2 border-amber-400/40"
                >
                  <div>
                    <span className="bg-amber-950/60 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-400/30">
                      異動現象
                    </span>
                    <h3 className="text-2xl font-black mt-2">🟡 不自主扭動</h3>
                    <p className="text-xs text-amber-100 font-normal mt-1 opacity-90">手腳或頭部出現非自主舞蹈般扭動</p>
                  </div>
                  <ChevronRight className="w-8 h-8 text-amber-200 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickLog('med', '服藥：巴金森藥物', '按時服藥')}
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black shadow-lg hover:shadow-sky-500/20 active:scale-95 transition-all text-left flex items-start justify-between border-2 border-sky-400/40"
                >
                  <div>
                    <span className="bg-sky-950/60 text-sky-300 text-xs px-3 py-1 rounded-full border border-sky-400/30">
                      用藥時間
                    </span>
                    <h3 className="text-2xl font-black mt-2">💊 剛吃完藥物</h3>
                    <p className="text-xs text-sky-100 font-normal mt-1 opacity-90">記錄此刻完成服藥，便於追蹤藥效起效時間</p>
                  </div>
                  <ChevronRight className="w-8 h-8 text-sky-200 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* AI 語音記一筆卡片 */}
            <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h3 className="font-bold text-white text-base">口述語音記一筆（AI 小舒自動彙整）</h3>
                </div>
                <span className="text-xs text-teal-400 bg-teal-950/60 border border-teal-500/30 px-2.5 py-1 rounded-full">
                  智慧語意理解
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleStartVoice}
                  disabled={isListening || isProcessingAI}
                  className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black flex items-center justify-center space-x-2 transition-all text-base shadow-lg ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-6 h-6" />
                      <span>正在聆聽中... (請說話)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6" />
                      <span>按下開始口述</span>
                    </>
                  )}
                </button>

                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={speechText}
                    onChange={(e) => setSpeechText(e.target.value)}
                    placeholder="或直接打字（例如：下午一點半吃藥，兩點手有些微震顫...）"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {speechText && !isListening && (
                  <button
                    onClick={() => processVoiceWithAI(speechText)}
                    disabled={isProcessingAI}
                    className="w-full sm:w-auto px-5 py-3.5 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm hover:bg-emerald-400 whitespace-nowrap"
                  >
                    送出 AI 紀錄
                  </button>
                )}
              </div>

              {aiNotice && (
                <p className="mt-3 text-xs text-amber-300 font-medium flex items-center">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {aiNotice}
                </p>
              )}
            </div>

            {/* 客觀手指敲擊自我測試 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-3xl border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-white text-base">10 秒雙手手指交替敲擊測試 (Finger Tapping)</h3>
                </div>
                <span className="text-xs text-slate-400">量化運動靈巧度</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                按下開始後，請用左右食指<strong>盡可能快速交替點擊</strong>按鈕，測試您的運動協調度。
              </p>

              {!tapTestActive ? (
                <button
                  onClick={startTapTest}
                  className="w-full py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-teal-300 font-bold rounded-2xl flex items-center justify-center space-x-2 text-base transition-all"
                >
                  <Play className="w-5 h-5 fill-teal-300" />
                  <span>開始 10 秒靈巧度測試</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-bold">倒數時間：<strong className="text-rose-400 text-xl">{tapTimeLeft}</strong> 秒</span>
                    <span className="text-xs text-slate-400 font-bold">交替點擊：<strong className="text-teal-400 text-xl">{tapCount}</strong> 次</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => registerTap('L')}
                      className={`p-10 rounded-2xl font-black text-2xl border-4 transition-all ${
                        lastTapHand === 'L' 
                          ? 'bg-slate-850 border-slate-700 text-slate-500 scale-95' 
                          : 'bg-teal-500 border-teal-300 text-slate-950 shadow-lg active:scale-90'
                      }`}
                    >
                      👈 左手點擊
                    </button>

                    <button
                      onClick={() => registerTap('R')}
                      className={`p-10 rounded-2xl font-black text-2xl border-4 transition-all ${
                        lastTapHand === 'R' 
                          ? 'bg-slate-850 border-slate-700 text-slate-500 scale-95' 
                          : 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-lg active:scale-90'
                      }`}
                    >
                      👉 右手點擊
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 近期紀錄 */}
            <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700/60">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-teal-400" />
                  最近紀錄時間軸
                </span>
                <span className="text-xs text-slate-500 font-normal">共 {logs.length} 筆紀錄</span>
              </h3>

              <div className="space-y-2.5">
                {logs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {log.mood || '😊'}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slate-200">{log.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400">{log.note}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 解凍與復健頁籤 */}
        {activeTab === 'rehab' && (
          <div className="space-y-6">

            {/* 步態凍結 (Freezing of Gait) 聽覺節拍器 */}
            <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-rose-300 flex items-center">
                    <Music className="w-5 h-5 mr-2 text-rose-400" />
                    步態凍結解凍節拍器 (Freezing Rhythm Cueing)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    當起步腳步凍結卡住時，跟著「1 - 2 - 1 - 2」規律聲響與畫面躍動，跨大步踏出去。
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-5">
                {/* 節拍視覺顯示 */}
                <div className="flex items-center space-x-8 my-2">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black border-4 transition-all ${
                    metronomeActive && metronomeBeat === 1 
                      ? 'bg-rose-500 border-rose-300 text-white scale-110 shadow-lg shadow-rose-500/50' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    1 (左)
                  </div>
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black border-4 transition-all ${
                    metronomeActive && metronomeBeat === 2 
                      ? 'bg-amber-500 border-amber-300 text-slate-950 scale-110 shadow-lg shadow-amber-500/50' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    2 (右)
                  </div>
                </div>

                {/* 速度調整 sliders */}
                <div className="w-full max-w-xs space-y-2 text-center">
                  <div className="flex justify-between text-xs text-slate-400 font-bold">
                    <span>速度節奏 (BPM)：</span>
                    <span className="text-teal-300 font-mono text-base">{bpm} BPM</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="120"
                    step="5"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value, 10))}
                    disabled={metronomeActive}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* 開始/停止按鈕 */}
                <button
                  onClick={toggleMetronome}
                  className={`px-8 py-4 rounded-2xl font-black text-lg flex items-center space-x-2 shadow-xl transition-all ${
                    metronomeActive 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' 
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                  }`}
                >
                  {metronomeActive ? (
                    <>
                      <VolumeX className="w-6 h-6" />
                      <span>停止節拍器</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-6 h-6" />
                      <span>啟動解凍節拍聲響</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 大聲發聲練習 (LSVT LOUD) */}
            <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-amber-300 flex items-center">
                    <Mic className="w-5 h-5 mr-2 text-amber-400" />
                    5 秒大聲發聲練習 (Vocal Loudness Exercise)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    深吸一口氣，對著麥克風大聲發出「啊——」長音 5 秒鐘，訓練聲帶肌力與音量。
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 flex flex-col items-center space-y-4">
                {vocalTesting ? (
                  <div className="w-full text-center space-y-3">
                    <span className="text-xs text-rose-400 font-bold">保持大聲「啊——」倒數：</span>
                    <div className="text-4xl font-black text-rose-400 font-mono">{vocalTimeLeft} 秒</div>
                    
                    {/* 音量動態條 */}
                    <div className="w-full bg-slate-800 h-6 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full transition-all duration-75"
                        style={{ width: `${vocalVolume}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">當前音量分貝強度：{vocalVolume} %</span>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    {vocalScore > 0 && (
                      <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300 font-bold text-sm">
                        🎉 上次測驗發聲得分：{vocalScore} 分！表現優異！
                      </div>
                    )}
                    <button
                      onClick={startVocalTest}
                      className="px-8 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-base flex items-center space-x-2 shadow-lg"
                    >
                      <Mic className="w-6 h-6" />
                      <span>開始 5 秒發聲測試</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 身體趨勢頁籤 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700">
              <h2 className="text-lg font-bold text-amber-300 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-amber-400" />
                身體狀態與藥效波動多元趨勢圖
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                透過多維度數據圖表，協助您與醫師精準找出「藥效退去時段」與「動作靈巧度趨勢」。
              </p>
            </div>

            {/* 圖表 1: 24小時時段劑末現象波動圖 */}
            <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-rose-400" />
                    各時段藥效退去 (Off 僵硬) 發生率圖
                  </h3>
                  <p className="text-xs text-slate-400">觀察幾點容易出現「劑末現象 (Wearing-off)」，作為調整服藥時間參考</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.hourlyTrendData}>
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="Off" name="僵硬/退藥次數" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.3} strokeWidth={2} />
                    <Area type="monotone" dataKey="On" name="順暢次數" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 圖表 2: 手指敲擊敏捷度長期折線圖 */}
            <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-teal-400" />
                    手指敲擊速度長期趨勢圖 (Taps per 10 Sec)
                  </h3>
                  <p className="text-xs text-slate-400">客觀量化手部精細動作與協調度的進步歷程</p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.tapHistory}>
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor