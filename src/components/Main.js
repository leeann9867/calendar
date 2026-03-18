import React from 'react';
import CalendarSection from './CalendarSection';
import EventModal from './EventModal'; // 내부 부품을 포함한 모달
import { useCalendar } from '../hooks/useCalendar';
import { useNotification } from '../hooks/useNotification';

/**
 * 메인 컨텐츠 영역
 * 캘린더 렌더링과 모달 호출을 제어하는 실질적인 '두뇌' 역할
 */
function Main() {
    const {
        currentDate,
        events,
        modalConfig,
        openModal,
        closeModal,
        handleSaveEvent,
        handleDeleteEvent
    } = useCalendar();

    // 백그라운드 알림 감시 엔진 실행
    useNotification(events);

    return (
        <main className="content-container">
            {/* 달력 그리드 표시 */}
            <CalendarSection
                currentDate={currentDate}
                events={events}
                onDateClick={(date) => openModal(date)}
                onEventClick={(date, event) => openModal(date, event)}
            />

            {/* 모달이 열려있을 때만 렌더링 */}
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