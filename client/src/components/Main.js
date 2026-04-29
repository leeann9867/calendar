import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import CalendarSection from './CalendarSection';
import SidePanel from './SidePanel';
import Footer from './Footer';
import ModalView from './ModalView';

import { useEvents } from '../hooks/useEvents';
import { useAlarms } from '../hooks/useAlarms';

/**
 * [Main Component]
 * 앱의 최상단 부모 컴포넌트입니다.
 * 테마, 현재 기준 날짜(currentDate), 선택된 태그 등 앱의 전반적인 'View 상태'를 들고 있으며
 * 하위 컴포넌트들에게 프롭스(Props)로 분배해주는 라우터 역할을 합니다.
 */
function Main() {
    // 백그라운드 데이터 로직(저장, 삭제, 알림)은 Custom Hook에게 완전히 위임!
    const { events, handleSaveEvent, handleDeleteEvent, handleUpdateEventDate } = useEvents();
    useAlarms(events);

    // 화면 제어를 위한 UI 상태값들
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(null); // 태그 필터링을 위한 전역 상태
    const [modalConfig, setModalConfig] = useState({ isOpen: false, selectedDate: null, event: null });
    const [theme, setTheme] = useState(localStorage.getItem('calendar_theme') || 'light');
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'

    // 테마가 바뀔 때마다 HTML 문서 최상단 속성(data-theme)을 바꿔서 CSS 전역 변수가 교체되도록 유도
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('calendar_theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const getLocalToday = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 키보드 화살표 뷰 이동 로직 (메모이제이션으로 렌더링 최적화)
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

    // 방향키 좌우 입력 감지
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (modalConfig.isOpen) return; // 모달이 켜져있으면 무시
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; // 타이핑 중일 때 무시
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalConfig.isOpen, handlePrev, handleNext]);

    // 모달 닫기 래퍼 함수 (성공적으로 저장/삭제될 경우에만 모달을 닫음)
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
                    {/* 상단 컨트롤 패널 */}
                    <Header
                        currentDate={currentDate} onPrev={handlePrev} onNext={handleNext}
                        onToday={() => setCurrentDate(new Date())} onJump={(y, m) => setCurrentDate(new Date(y, m - 1, 1))}
                        theme={theme} onToggleTheme={toggleTheme} viewMode={viewMode} setViewMode={setViewMode}
                    />
                    {/* 중앙 달력 본문 (여기서 월/주/일 분기 처리됨) */}
                    <CalendarSection
                        currentDate={currentDate}
                        events={events.filter(ev => ev.title.toLowerCase().includes(searchTerm.toLowerCase()))} // 검색 필터링 즉시 적용
                        selectedTag={selectedTag}
                        onOpenModal={(date, ev) => setModalConfig({ isOpen: true, selectedDate: date, event: ev })}
                        onUpdateEventDate={handleUpdateEventDate}
                        onPrev={handlePrev} onNext={handleNext}
                        viewMode={viewMode}
                    />
                </div>
                {/* 우측 위젯 패널 */}
                <SidePanel events={events} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
            </div>

            <Footer />

            {/* 모바일 전용 플로팅 추가 버튼 */}
            <button className="fab-add-btn" onClick={() => setModalConfig({ isOpen: true, selectedDate: getLocalToday(), event: null })}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>

            {/* 전역 모달 창 */}
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