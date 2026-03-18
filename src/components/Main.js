import React from 'react';
import CalendarSection from './CalendarSection';
import { useNotification } from '../hooks/useNotification';

/**
 * 메인 컨텐츠 영역:
 * 부모(App.js)로부터 전달받은 calendar 상태를 사용하고,
 * 알림 서비스(useNotification)를 가동합니다.
 */
function Main({ calendar }) {
    // 1. 알림 엔진 가동 (일정 변화를 감시하여 브라우저 알림 발생)
    useNotification(calendar.events);

    // 2. 만약 calendar 객체가 아직 로드되지 않았다면 안전하게 처리
    if (!calendar) return null;

    return (
        <main className="main-content-area">
            {/* 달력 그리드 섹션에 모든 상태와 제어 함수 전달 */}
            <CalendarSection
                currentDate={calendar.currentDate}
                calendarData={calendar.calendarData} // 추가
                getEventsForDate={calendar.getEventsForDate} // 추가
                events={calendar.events}
                modalConfig={calendar.modalConfig}
                openModal={calendar.openModal}
                closeModal={calendar.closeModal}
                onSave={calendar.handleSaveEvent}
                onDelete={calendar.handleDeleteEvent}
            />
        </main>
    );
}

// 👈 이 부분이 빠져있었을 겁니다! 반드시 추가해주세요.
export default Main;