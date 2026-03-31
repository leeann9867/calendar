import React, { useState, useEffect } from 'react';
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

    // 🌟 뷰 모드 상태 관리
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

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

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const getLocalToday = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 🌟 뷰 모드에 따른 이동 로직 (월/주/일)
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
                        viewMode={viewMode} // 🚀 전달
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
                        viewMode={viewMode} // 🚀 렌더링 엔진에 뷰 모드 전달
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