import React, { useState, useEffect, useRef, useCallback } from 'react'; // 🚀 useCallback 추가
import Header from './Header';
import CalendarSection from './CalendarSection';
import SidePanel from './SidePanel';
import Footer from './Footer';
import ModalView from './ModalView';

function Main() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, selectedDate: null, event: null });
    const [theme, setTheme] = useState(localStorage.getItem('calendar_theme') || 'light');
    const [viewMode, setViewMode] = useState('month');
    const notifiedEvents = useRef(new Set());

    useEffect(() => {
        const saved = localStorage.getItem('calendar_events');
        if (saved) setEvents(JSON.parse(saved));
        if (Notification.permission !== 'granted') Notification.requestPermission();
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('calendar_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('calendar_events', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        const checkAlarms = () => {
            if (Notification.permission !== 'granted') return;
            const now = new Date();
            const nowTime = now.getTime();
            events.forEach(ev => {
                if (!ev.startTime) return;
                let reminderMs = 0;
                const rVal = parseInt(ev.reminderValue, 10) || 0;
                if (ev.reminderUnit === 'm') reminderMs = rVal * 60 * 1000;
                else if (ev.reminderUnit === 'h') reminderMs = rVal * 60 * 60 * 1000;
                else if (ev.reminderUnit === 'd') reminderMs = rVal * 24 * 60 * 60 * 1000;
                if (reminderMs === 0 && rVal === 0) return;

                const targetDate = new Date(`${ev.startDate}T${ev.startTime}:00`);
                const targetTime = targetDate.getTime();
                const alarmTime = targetTime - reminderMs;
                if (nowTime >= alarmTime && nowTime <= alarmTime + 5 * 60 * 1000) {
                    const uniqueEventKey = `${ev.id}-${ev.startDate}`;
                    if (!notifiedEvents.current.has(uniqueEventKey)) {
                        new Notification(`📅 [다가오는 일정] ${ev.title}`, {
                            body: `일정이 ${rVal}${ev.reminderUnit === 'm' ? '분' : ev.reminderUnit === 'h' ? '시간' : '일'} 뒤에 시작됩니다!\n시간: ${ev.startTime}`
                        });
                        notifiedEvents.current.add(uniqueEventKey);
                    }
                }
            });
        };
        const intervalId = setInterval(checkAlarms, 60000);
        checkAlarms();
        return () => clearInterval(intervalId);
    }, [events]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const getLocalToday = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 🌟 [핵심 수정] ESLint 경고 해결을 위해 useCallback으로 함수를 감싸줍니다.
    const handlePrev = useCallback(() => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
            else if (viewMode === 'week') d.setDate(d.getDate() - 7);
            else if (viewMode === 'day') d.setDate(d.getDate() - 1);
            return d;
        });
    }, [viewMode]);

    const handleNext = useCallback(() => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
            else if (viewMode === 'week') d.setDate(d.getDate() + 7);
            else if (viewMode === 'day') d.setDate(d.getDate() + 1);
            return d;
        });
    }, [viewMode]);

    // 🌟 [핵심 수정] 이제 handlePrev, handleNext를 안전하게 배열에 넣을 수 있습니다.
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (modalConfig.isOpen) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalConfig.isOpen, handlePrev, handleNext]); // 👈 ESLint 완벽 해결!

    const handleSaveEvent = (data, mode = 'all', instanceDate = null) => {
        const isDuplicate = events.some(ev => ev.id !== data.id && ev.startDate === data.startDate && ev.startTime === data.startTime);
        if (isDuplicate) {
            alert('해당 날짜, 해당 시간에 이미 다른 일정이 있습니다. 중복 등록할 수 없습니다.');
            return;
        }
        setEvents(prev => {
            const idx = prev.findIndex(e => e.id === data.id);
            if (idx > -1) {
                if (mode === 'all') {
                    const next = [...prev];
                    next[idx] = { ...data, excludedDates: prev[idx].excludedDates || [], repeatEndDate: prev[idx].repeatEndDate };
                    return next;
                } else if (mode === 'single' && instanceDate) {
                    const next = [...prev];
                    const currentExclusions = next[idx].excludedDates || [];
                    next[idx] = { ...next[idx], excludedDates: [...currentExclusions, instanceDate] };
                    const newStandaloneEvent = { ...data, id: Date.now().toString(), repeatUnit: 'none', repeatValue: 1, excludedDates: [], repeatEndDate: null };
                    return [...next, newStandaloneEvent];
                }
            }
            return [...prev, { ...data, excludedDates: [] }];
        });
        setModalConfig({ isOpen: false, selectedDate: null, event: null });
    };

    const handleDeleteEvent = (eventId, instanceDate, mode = 'all') => {
        setEvents(prev => {
            const targetIdx = prev.findIndex(ev => ev.id === eventId);
            if (targetIdx === -1) return prev;
            const targetEvent = prev[targetIdx];
            if (mode === 'all' || !targetEvent.repeatUnit || targetEvent.repeatUnit === 'none') return prev.filter(ev => ev.id !== eventId);
            if (mode === 'single') {
                const next = [...prev];
                const currentExclusions = next[targetIdx].excludedDates || [];
                next[targetIdx] = { ...next[targetIdx], excludedDates: [...currentExclusions, instanceDate] };
                return next;
            }
            if (mode === 'future') {
                const next = [...prev];
                next[targetIdx] = { ...next[targetIdx], repeatEndDate: instanceDate };
                return next;
            }
            return prev;
        });
        setModalConfig({ isOpen: false, selectedDate: null, event: null });
    };

    const handleUpdateEventDate = (eventId, newDate, newStartTime = null) => {
        const targetEv = events.find(e => e.id === eventId);
        if (!targetEv) return;
        const checkTime = newStartTime || targetEv.startTime;
        const isDuplicate = events.some(ev => ev.id !== eventId && ev.startDate === newDate && ev.startTime === checkTime);
        if (isDuplicate) { alert('이동하려는 날짜와 시간에 이미 일정이 있습니다.'); return; }

        setEvents(prev => prev.map(ev => {
            if (ev.id === eventId) {
                if (ev.repeatUnit && ev.repeatUnit !== 'none') {
                    alert('반복 일정은 드래그로 이동할 수 없습니다. 클릭해서 수정해주세요.');
                    return ev;
                }
                const oldStart = new Date(ev.startDate);
                const oldEnd = new Date(ev.endDate || ev.startDate);
                const diffDays = Math.round((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));
                const updatedStart = new Date(newDate);
                const updatedEnd = new Date(updatedStart);
                updatedEnd.setDate(updatedEnd.getDate() + diffDays);
                const y = updatedEnd.getFullYear();
                const m = String(updatedEnd.getMonth() + 1).padStart(2, '0');
                const d = String(updatedEnd.getDate()).padStart(2, '0');
                const formattedEnd = `${y}-${m}-${d}`;

                let updatedStartTime = ev.startTime;
                let updatedEndTime = ev.endTime;
                if (newStartTime) {
                    updatedStartTime = newStartTime;
                    const oldStartMins = parseInt(ev.startTime.split(':')[0]) * 60 + parseInt(ev.startTime.split(':')[1]);
                    const oldEndMins = parseInt(ev.endTime.split(':')[0]) * 60 + parseInt(ev.endTime.split(':')[1]);
                    const durationMins = oldEndMins - oldStartMins;
                    const newStartMins = parseInt(newStartTime.split(':')[0]) * 60 + parseInt(newStartTime.split(':')[1]);
                    const newEndMins = newStartMins + durationMins;
                    let newEndHour = Math.floor(newEndMins / 60);
                    let newEndMinute = newEndMins % 60;
                    if (newEndHour >= 24) { newEndHour = 23; newEndMinute = 59; }
                    updatedEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;
                }
                return { ...ev, startDate: newDate, endDate: formattedEnd, startTime: updatedStartTime, endTime: updatedEndTime };
            }
            return ev;
        }));
    };

    return (
        <div className="app-container">
            <div className="top-header-row">
                <h1 className="main-title">My Calendar</h1>
                <button className="theme-toggle" onClick={toggleTheme}>
                    <span className="theme-desktop">{theme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드'}</span>
                    <span className="theme-mobile">{theme === 'light' ? '🌙' : '☀️'}</span>
                </button>
            </div>

            <div className="content-wrapper">
                <div className="calendar-card">
                    <Header
                        currentDate={currentDate}
                        onToday={() => setCurrentDate(new Date())}
                        onJump={(y, m) => setCurrentDate(new Date(y, m - 1, 1))}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />
                    <CalendarSection
                        currentDate={currentDate}
                        events={events.filter(ev => ev.title.toLowerCase().includes(searchTerm.toLowerCase()))}
                        selectedTag={selectedTag}
                        onOpenModal={(date, ev) => setModalConfig({ isOpen: true, selectedDate: date, event: ev })}
                        onUpdateEventDate={handleUpdateEventDate}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        viewMode={viewMode}
                    />
                </div>
                <SidePanel events={events} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
            </div>
            <Footer />
            <button className="fab-add-btn" onClick={() => setModalConfig({ isOpen: true, selectedDate: getLocalToday(), event: null })}>+</button>

            {modalConfig.isOpen && (
                <ModalView
                    selectedDate={modalConfig.selectedDate} initData={modalConfig.event}
                    onClose={() => setModalConfig({ isOpen: false, selectedDate: null, event: null })}
                    onSave={handleSaveEvent} onDelete={handleDeleteEvent}
                />
            )}
        </div>
    );
}

export default Main;