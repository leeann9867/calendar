import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import CalendarSection from './CalendarSection';
import SidePanel from './SidePanel';
import Footer from './Footer';
import ModalView from './ModalView';

// 🌟 커스텀 훅 가져오기
import { useEvents } from '../hooks/useEvents';
import { useAlarms } from '../hooks/useAlarms';

function Main() {
    // 🌟 분리된 비즈니스 로직 적용
    const { events, handleSaveEvent, handleDeleteEvent, handleUpdateEventDate } = useEvents();
    useAlarms(events);

    // 뷰와 관련된 상태들만 유지
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, selectedDate: null, event: null });
    const [theme, setTheme] = useState(localStorage.getItem('calendar_theme') || 'light');
    const [viewMode, setViewMode] = useState('month');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('calendar_theme', theme);
    }, [theme]);

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

    // 모달 제어용 래퍼 함수
    const onSave = (data, mode, instanceDate) => {
        const success = handleSaveEvent(data, mode, instanceDate);
        if (success) setModalConfig({ isOpen: false, selectedDate: null, event: null });
    };

    const onDelete = (eventId, instanceDate, mode) => {
        handleDeleteEvent(eventId, instanceDate, mode);
        setModalConfig({ isOpen: false, selectedDate: null, event: null });
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
                    onSave={onSave}
                    onDelete={onDelete}
                />
            )}
        </div>
    );
}

export default Main;