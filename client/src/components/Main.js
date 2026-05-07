import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import CalendarSection from './CalendarSection';
import SidePanel from './SidePanel';
import Footer from './Footer';
import ModalView from './ModalView';
import ConfirmModal from './modal/ConfirmModal';

import { useEvents } from '../hooks/useEvents';
import { useAlarms } from '../hooks/useAlarms';
import { Toaster } from 'react-hot-toast';

/**
 * [Main Component]
 * 앱의 최상단 부모 컴포넌트입니다.
 * 테마, 현재 기준 날짜(currentDate), 선택된 태그 등 앱의 전반적인 'View 상태'를 들고 있으며
 * 하위 컴포넌트들에게 프롭스(Props)로 분배해주는 라우터 역할을 합니다.
 */
function Main() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { events, isLoading, handleSaveEvent, handleDeleteEvent, handleUpdateEventDate, handleDeleteAllOnDate } = useEvents(currentDate);
    useAlarms(events);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, selectedDate: null, event: null });

    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', options: [] });

    const openConfirm = useCallback((title, message, options) => {
        setConfirmConfig({ isOpen: true, title, message, options });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmConfig({ isOpen: false, title: '', message: '', options: [] });
    }, []);

    const [theme, setTheme] = useState(localStorage.getItem('calendar_theme') || 'light');
    const [viewMode, setViewMode] = useState('month');

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
            if (modalConfig.isOpen || confirmConfig.isOpen) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalConfig.isOpen, confirmConfig.isOpen, handlePrev, handleNext]);

    const onSave = async (data, mode, instanceDate) => {
        const success = await handleSaveEvent(data, mode, instanceDate);
        if (success) setModalConfig({ isOpen: false, selectedDate: null, event: null });
    };

    const onDelete = async (eventId, instanceDate, mode) => {
        await handleDeleteEvent(eventId, instanceDate, mode);
        setModalConfig({ isOpen: false, selectedDate: null, event: null });
    };

    // 🌟 [버그 픽스] className을 "sub-btn delete-all"로 수정하여 서브 모달 디자인과 매칭!
    const confirmDeleteAll = useCallback((dateStr, targetEvents) => {
        if (!targetEvents || targetEvents.length === 0) return;
        openConfirm(
            "일괄 삭제",
            `${dateStr}의 모든 일정(${targetEvents.length}개)을 삭제하시겠습니까?`,
            [{ label: "모두 삭제하기", className: "sub-btn delete-all", action: () => handleDeleteAllOnDate(dateStr, targetEvents) }]
        );
    }, [handleDeleteAllOnDate, openConfirm]);

    return (
        <div className="app-container">
            <Toaster
                position="top-center"
                reverseOrder={false}
                containerStyle={{ zIndex: 999999 }}
                toastOptions={{
                    // 🌟 1. 토스트 전체 기본 스타일 (넓게, 예쁘게, 테마 연동)
                    style: {
                        minWidth: '350px',       // 기본 너비를 확 넓혔습니다!
                        maxWidth: '90vw',        // 모바일에서도 화면을 넘지 않게 방어
                        padding: '16px 24px',    // 위아래 양옆 여백을 넉넉하게
                        fontSize: '1.05rem',     // 글씨 크기 약간 키움
                        fontWeight: '600',
                        borderRadius: '16px',    // 앱 모달들과 통일감 있게 둥글게
                        background: 'var(--bg-card)', // 라이트/다크 모드 배경색 연동
                        color: 'var(--text-main)',    // 텍스트 색상 연동
                        boxShadow: '0 10px 40px var(--shadow)',
                        border: '1px solid var(--border-color)'
                    },
                    // 🌟 2. 성공 알림 (초록색 체크)
                    success: {
                        iconTheme: {
                            primary: 'var(--sat-blue)', // 체크 아이콘 색상을 포인트 블루로
                            secondary: 'white',
                        },
                    },
                    // 🌟 3. 에러/삭제 알림 (빨간색 엑스)
                    error: {
                        iconTheme: {
                            primary: 'var(--sun-red)',
                            secondary: 'white',
                        },
                    },
                }}
            />
            <ConfirmModal config={confirmConfig} onClose={closeConfirm} />

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
                        events={events}
                        onImport={(data) => handleSaveEvent(data, 'all')}
                    />
                    {/* 중앙 달력 본문 (여기서 월/주/일 분기 처리됨) */}
                    <CalendarSection
                        currentDate={currentDate}
                        events={events.filter(ev => ev.title.toLowerCase().includes(searchTerm.toLowerCase()))}
                        selectedTag={selectedTag}
                        isLoading={isLoading}
                        onOpenModal={(date, ev) => setModalConfig({ isOpen: true, selectedDate: date, event: ev })}
                        onUpdateEventDate={handleUpdateEventDate}
                        onDeleteAllOnDate={confirmDeleteAll}
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
                    openConfirm={openConfirm}
                />
            )}
        </div>
    );
}

export default Main;