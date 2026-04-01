import React, { useState, useEffect, useRef, useCallback } from 'react';
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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (modalConfig.isOpen) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalConfig.isOpen, handlePrev, handleNext]);

    const handleSaveEvent = (data, mode = 'all', instanceDate = null) => {
        const newStartMs = new Date(`${data.startDate}T${data.startTime || '00:00'}:00`).getTime();
        const newEndMs = new Date(`${data.endDate || data.startDate}T${data.endTime || '23:59'}:00`).getTime();

        const isOverlap = events.some(ev => {
            if (ev.id === data.id) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            alert('해당 시간대에 이미 겹치는 일정이 있습니다. 다른 시간을 선택해주세요.');
            return;
        }

        setEvents(prev => {
            const idx = prev.findIndex(e => e.id === data.id);
            if (idx > -1) {
                if (mode === 'all') {
                    const next = [...prev];
                    const originalEvent = prev[idx];
                    const sMs = new Date(`${data.startDate}T00:00:00`).getTime();
                    const eMs = new Date(`${data.endDate || data.startDate}T00:00:00`).getTime();
                    const diffDays = Math.round((eMs - sMs) / (1000 * 60 * 60 * 24));
                    const origStart = new Date(`${originalEvent.startDate}T00:00:00`);
                    const origEnd = new Date(origStart);
                    origEnd.setDate(origEnd.getDate() + diffDays);
                    const y = origEnd.getFullYear();
                    const m = String(origEnd.getMonth() + 1).padStart(2, '0');
                    const d = String(origEnd.getDate()).padStart(2, '0');
                    next[idx] = {
                        ...data,
                        startDate: originalEvent.startDate,
                        endDate: `${y}-${m}-${d}`,
                        excludedDates: originalEvent.excludedDates || [],
                        repeatEndDate: originalEvent.repeatEndDate
                    };
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
                const targetDate = new Date(`${instanceDate}T00:00:00`);
                targetDate.setDate(targetDate.getDate() - 1);
                const y = targetDate.getFullYear();
                const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                const d = String(targetDate.getDate()).padStart(2, '0');
                next[targetIdx] = { ...next[targetIdx], repeatEndDate: `${y}-${m}-${d}` };
                return next;
            }
            return prev;
        });
        setModalConfig({ isOpen: false, selectedDate: null, event: null });
    };

    const handleUpdateEventDate = (eventId, newDate, newStartTime = null) => {
        const targetEv = events.find(e => e.id === eventId);
        if (!targetEv) return;

        if (targetEv.repeatUnit && targetEv.repeatUnit !== 'none') {
            alert('반복 일정은 드래그로 이동할 수 없습니다. 클릭해서 수정해주세요.');
            return;
        }

        const oldStart = new Date(targetEv.startDate);
        const oldEnd = new Date(targetEv.endDate || targetEv.startDate);
        const diffDays = Math.round((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));

        const updatedStart = new Date(newDate);
        const updatedEnd = new Date(updatedStart);
        updatedEnd.setDate(updatedEnd.getDate() + diffDays);
        const y = updatedEnd.getFullYear();
        const m = String(updatedEnd.getMonth() + 1).padStart(2, '0');
        const d = String(updatedEnd.getDate()).padStart(2, '0');
        const formattedEnd = `${y}-${m}-${d}`;

        let updatedStartTime = targetEv.startTime || '00:00';
        let updatedEndTime = targetEv.endTime || '23:59';

        if (newStartTime) {
            updatedStartTime = newStartTime;
            const oldStartMins = parseInt(targetEv.startTime.split(':')[0]) * 60 + parseInt(targetEv.startTime.split(':')[1]);
            const oldEndMins = parseInt(targetEv.endTime.split(':')[0]) * 60 + parseInt(targetEv.endTime.split(':')[1]);
            const durationMins = oldEndMins - oldStartMins;

            const newStartMins = parseInt(newStartTime.split(':')[0]) * 60 + parseInt(newStartTime.split(':')[1]);
            const newEndMins = newStartMins + durationMins;

            let newEndHour = Math.floor(newEndMins / 60);
            let newEndMinute = newEndMins % 60;
            if (newEndHour >= 24) { newEndHour = 23; newEndMinute = 59; }
            updatedEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;
        }

        const newStartMs = new Date(`${newDate}T${updatedStartTime}:00`).getTime();
        const newEndMs = new Date(`${formattedEnd}T${updatedEndTime}:00`).getTime();

        const isOverlap = events.some(ev => {
            if (ev.id === eventId) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            alert('이동하려는 시간대에 이미 겹치는 일정이 있습니다.');
            return;
        }

        setEvents(prev => prev.map(ev => {
            if (ev.id === eventId) {
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
                        onPrev={handlePrev}
                        onNext={handleNext}
                        onToday={() => setCurrentDate(new Date())}
                        onJump={(y, m) => setCurrentDate(new Date(y, m - 1, 1))}
                        theme={theme}
                        onToggleTheme={toggleTheme}
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

            {/* 🌟 버그 수정: 폰트 문제로 쏠리던 텍스트 '+' 대신 완벽하게 렌더링되는 SVG 적용 */}
            <button className="fab-add-btn" onClick={() => setModalConfig({ isOpen: true, selectedDate: getLocalToday(), event: null })}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>

            {modalConfig.isOpen && (
                <ModalView
                    selectedDate={modalConfig.selectedDate}
                    initData={modalConfig.event}
                    events={events}
                    onClose={() => setModalConfig({ isOpen: false, selectedDate: null, event: null })}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                />
            )}
        </div>
    );
}

export default Main;