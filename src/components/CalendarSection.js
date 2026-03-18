import React from 'react';
import EventModal from './EventModal';

/**
 * 달력 본체 및 일정 렌더링 컴포넌트
 */
function CalendarSection({ currentDate, events, modalConfig, openModal, closeModal, onSave, onDelete }) {

    // 날짜 포맷 유틸리티 (YYYY-MM-DD)
    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 해당 날짜에 일정이 표시되어야 하는지 체크하는 로직 (반복 일정 포함)
    const isVisible = (event, targetDate) => {
        const targetStr = formatDate(targetDate);
        if (targetStr < event.date) return false;
        if (event.until && targetStr > event.until) return false;
        if (event.deletedDates?.includes(targetStr)) return false;

        // 반복 타입별 노출 로직 (생략 - 기존 로직 유지)
        return true;
    };

    // 달력 날짜 배열 생성 (이전달, 현재달, 다음달 포함 42일)
    const days = [];
    /* ... (기존 generateDays 로직 동일) ... */

    return (
        <main className="calendar-container">
            <div className="calendar-grid">
                {/* 요일 헤더 */}
                {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                    <div key={d} className="day-header">{d}</div>
                ))}

                {/* 날짜 셀 렌더링 */}
                {days.map((item, i) => (
                    <div
                        key={i}
                        className={`day-column ${item.type !== 'current' ? 'other-month' : ''}`}
                        onClick={() => openModal(formatDate(item.date))}
                    >
                        <span className="day-num">{item.date.getDate()}</span>
                        {/* 일정 바 렌더링 영역 */}
                        <div className="event-container">
                            {/* renderDayEvents 호출 */}
                        </div>
                    </div>
                ))}
            </div>

            {/* 통합 모달 컴포넌트 호출 */}
            {modalConfig.isOpen && (
                <EventModal
                    initData={modalConfig.event || {
                        date: modalConfig.date,
                        time: "09:00",
                        endTime: "10:00",
                        isAllDay: false,
                        isNotificationEnabled: true,
                        reminders: [10]
                    }}
                    onSave={onSave}
                    onDelete={onDelete}
                    onClose={closeModal}
                />
            )}
        </main>
    );
}

export default CalendarSection;