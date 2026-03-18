import React from 'react';
import { formatDate } from '../utils/helpers';
import EventModal from './EventModal';

/**
 * 달력 그리드 렌더링 및 날짜 색상/이벤트 바 표시
 */
function CalendarSection({ currentDate, events, modalConfig, openModal, closeModal, onSave, onDelete }) {
    if (!modalConfig) return null;

    // 현재 월의 날짜 생성 (42칸 고정)
    const generateDays = () => {
        const days = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), type: 'prev' });
        for (let i = 1; i <= lastDate; i++) days.push({ date: new Date(year, month, i), type: 'current' });
        while (days.length < 42) days.push({ date: new Date(year, month + 1, days.length - (firstDay + lastDate) + 1), type: 'next' });
        return days;
    };

    return (
        <div className="calendar-grid">
            {/* 요일 헤더 (CSS nth-child에 의해 토/일 색상 적용) */}
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                <div key={d} className="day-header">{d}</div>
            ))}

            {/* 날짜 셀 */}
            {generateDays().map((item, i) => (
                <div
                    key={i}
                    className={`day-column ${item.type !== 'current' ? 'other-month' : ''} ${formatDate(new Date()) === formatDate(item.date) ? 'today' : ''}`}
                    onClick={() => openModal(formatDate(item.date))}
                >
                    <span className="day-num">{item.date.getDate()}</span>

                    {/* 일정 바 렌더링 (간략화된 버전) */}
                    <div className="event-container">
                        {events.filter(ev => formatDate(ev.date) === formatDate(item.date)).map(ev => (
                            <div
                                key={ev.id}
                                className={`event-bar color-${ev.color || 'blue'}`}
                                onClick={(e) => { e.stopPropagation(); openModal(formatDate(item.date), ev); }}
                            >
                                {ev.title}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* 모달 렌더링 */}
            {modalConfig.isOpen && (
                <EventModal
                    initData={modalConfig.event || {
                        date: modalConfig.date,
                        time: "09:00",
                        endTime: "10:00",
                        isNotificationEnabled: true,
                        reminders: [10]
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