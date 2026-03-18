import React from 'react';
import CalendarSection from './CalendarSection';
import EventModal from './EventModal';
import { useCalendar } from '../hooks/useCalendar';
import { useNotification } from '../hooks/useNotification';

/**
 * 메인 비즈니스 영역
 * 데이터 로직 연결 및 모달 팝업 제어
 */
function Main() {
    const {
        currentDate, events, modalConfig,
        openModal, closeModal, handleSaveEvent, handleDeleteEvent
    } = useCalendar();

    // 알림 서비스 실행
    useNotification(events);

    return (
        <main className="content-container">
            <CalendarSection
                currentDate={currentDate}
                events={events}
                onDateClick={(date) => openModal(date)}
                onEventClick={(date, event) => openModal(date, event)}
            />

            {/* 모달 호출부: 정의되지 않은 에러 방지를 위해 하단 index.js 기반 호출 */}
            {modalConfig.isOpen && (
                <EventModal
                    initData={modalConfig.event || {
                        date: modalConfig.date,
                        time: "09:00",
                        endTime: "10:00",
                        isNotificationEnabled: true,
                        reminders: [10]
                    }}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                    onClose={closeModal}
                />
            )}
        </main>
    );
}

export default Main;