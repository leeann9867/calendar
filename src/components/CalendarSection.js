import React from 'react';
import { formatDate } from '../utils/helpers';
import EventModal from './EventModal';

/**
 * 달력 그리드 렌더링 및 날짜 색상/이벤트 바 표시
 */
function CalendarSection({
                             currentDate,
                             calendarData = [], // useCalendar에서 생성한 42칸 데이터
                             getEventsForDate,   // 반복 일정까지 계산된 필터 함수
                             modalConfig,
                             openModal,
                             closeModal,
                             onSave,
                             onDelete
                         }) {
    // 1. 요일 헤더
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="calendar-grid">
            {/* 요일 헤더 */}
            {weekdays.map(d => (
                <div key={d} className="day-header">{d}</div>
            ))}

            {/* 날짜 셀 (useCalendar에서 계산된 calendarData 사용) */}
            {calendarData.map((item, i) => {
                // useCalendar의 로직을 사용하여 해당 날짜의 이벤트 가져오기
                const dayEvents = getEventsForDate ? getEventsForDate(item.date) : [];
                const dateStr = formatDate(item.date);
                const isToday = formatDate(new Date()) === dateStr;
                const isCurrentMonth = item.isCurrentMonth;

                return (
                    <div
                        key={i}
                        className={`day-column ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                        onClick={() => openModal(dateStr)}
                    >
                        <span className="day-num">{item.date.getDate()}</span>

                        {/* 일정 바 렌더링 */}
                        <div className="event-container">
                            {dayEvents.map(ev => (
                                <div
                                    key={ev.id}
                                    className={`event-bar ${ev.color || 'blue'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openModal(dateStr, ev);
                                    }}
                                >
                                    {ev.title || '(제목 없음)'}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* 모달 렌더링: modalConfig가 존재하고 isOpen이 true일 때만 */}
            {modalConfig && modalConfig.isOpen && (
                <EventModal
                    initData={modalConfig.event || {
                        date: modalConfig.date,
                        title: '',
                        color: 'blue',
                        repeat: 'none',
                        until: null,
                        time: "09:00",
                        endTime: "10:00"
                    }}
                    onSave={onSave}
                    onDelete={onDelete}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default CalendarSection;