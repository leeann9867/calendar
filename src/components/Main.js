import React, { useState, useEffect, useRef } from 'react';
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

    // 🌟 [신규] 이미 알림이 울린 일정들을 기억해두는 보관함 (중복 알림 방지)
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

    // --------------------------------------------------------
    // 🌟 [핵심] 실제 알람 팝업을 띄우는 백그라운드 엔진
    // --------------------------------------------------------
    useEffect(() => {
        const checkAlarms = () => {
            // 알림 권한이 없으면 무시
            if (Notification.permission !== 'granted') return;

            const now = new Date();
            const nowTime = now.getTime();

            events.forEach(ev => {
                // 반복 일정은 오늘 날짜 기준으로만 단순화해서 체크 (실무적 접근)
                // 완벽한 반복 계산은 렌더링 엔진과 분리되어 있어 여기서는 단일 및 오늘 일정 위주로 체크합니다.

                if (!ev.startTime) return;

                // 알림 설정값 밀리초 단위로 변환
                let reminderMs = 0;
                const rVal = parseInt(ev.reminderValue, 10) || 0;
                if (ev.reminderUnit === 'm') reminderMs = rVal * 60 * 1000;
                else if (ev.reminderUnit === 'h') reminderMs = rVal * 60 * 60 * 1000;
                else if (ev.reminderUnit === 'd') reminderMs = rVal * 24 * 60 * 60 * 1000;

                // 알림을 끌 경우(0) 무시
                if (reminderMs === 0 && rVal === 0) return;

                // 일정 시작 시간 객체 생성
                const targetDate = new Date(`${ev.startDate}T${ev.startTime}:00`);
                const targetTime = targetDate.getTime();

                // 알림이 울려야 하는 정확한 시간
                const alarmTime = targetTime - reminderMs;

                // 현재 시간이 알림 시간을 지났고, 아직 알림을 보낸 적이 없다면 (최대 5분 이내의 알람만 처리)
                if (nowTime >= alarmTime && nowTime <= alarmTime + 5 * 60 * 1000) {
                    const uniqueEventKey = `${ev.id}-${ev.startDate}`;

                    if (!notifiedEvents.current.has(uniqueEventKey)) {
                        // 브라우저 네이티브 알림 띄우기
                        new Notification(`📅 [다가오는 일정] ${ev.title}`, {
                            body: `일정이 ${rVal}${ev.reminderUnit === 'm' ? '분' : ev.reminderUnit === 'h' ? '시간' : '일'} 뒤에 시작됩니다!\n시간: ${ev.startTime}`,
                            icon: '/favicon.ico' // 필요시 아이콘 경로 추가
                        });

                        // 알림 보냄 처리
                        notifiedEvents.current.add(uniqueEventKey);
                    }
                }
            });
        };

        // 1분(60초)마다 알림 검사 실행
        const intervalId = setInterval(checkAlarms, 60000);
        // 컴포넌트 마운트 시 최초 1회 즉시 실행
        checkAlarms();

        return () => clearInterval(intervalId);
    }, [events]); // 이벤트 목록이 바뀔 때마다 엔진 업데이트

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const getLocalToday = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
        else if (viewMode === 'week') d.setDate(d.getDate() - 7);
        else if (viewMode === 'day') d.setDate(d.getDate() - 1);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
        else if (viewMode === 'week') d.setDate(d.getDate() + 7);
        else if (viewMode === 'day') d.setDate(d.getDate() + 1);
        setCurrentDate(d);
    };

    const handleSaveEvent = (data, mode = 'all', instanceDate = null) => {
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

            if (mode === 'all' || !targetEvent.repeatUnit || targetEvent.repeatUnit === 'none') {
                return prev.filter(ev => ev.id !== eventId);
            } else if (mode === 'single') {
                const next = [...prev];
                const currentExclusions = next[targetIdx].excludedDates || [];
                next[targetIdx] = { ...next[targetIdx], excludedDates: [...currentExclusions, instanceDate] };
                return next;
            } else if (mode === 'future') {
                const next = [...prev];
                next[targetIdx] = { ...next[targetIdx], repeatEndDate: instanceDate };
                return next;
            }
            return prev;
        });
        setModalConfig({ isOpen: false, selectedDate: null, event: null });
    };

    const handleUpdateEventDate = (eventId, newDate) => {
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
                return { ...ev, startDate: newDate, endDate: `${y}-${m}-${d}` };
            }
            return ev;
        }));
    };

    return (
        <div className="app-container">
            <h1 className="main-title">My Calendar</h1>
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