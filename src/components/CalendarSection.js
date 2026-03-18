import React from 'react';
import { formatDate } from '../utils/helpers';
import EventModal from './EventModal';

function CalendarSection({ calendarData, getEventsForDate, modalConfig, openModal, closeModal, onSave, onDelete }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const rows = [];
    for (let i = 0; i < calendarData.length; i += 7) rows.push(calendarData.slice(i, i + 7));

    const renderRowEvents = (week) => {
        const weekEvents = [];
        const seenInWeek = new Set();

        week.forEach((day) => {
            const events = getEventsForDate(day.date);
            events.sort((a, b) => a.date.localeCompare(b.date)).forEach(ev => {
                if (!seenInWeek.has(ev.id)) {
                    seenInWeek.add(ev.id);
                    let startIdx = week.findIndex(d => formatDate(d.date) === ev.date);
                    if (startIdx === -1) startIdx = 0;
                    let endIdx = week.findIndex(d => formatDate(d.date) === (ev.endDate || ev.date));
                    if (endIdx === -1) endIdx = 6;
                    weekEvents.push({ ...ev, startIdx, endIdx, refDate: formatDate(day.date) });
                }
            });
        });

        return weekEvents.map((ev, i) => {
            const isActualStart = ev.date === formatDate(week[ev.startIdx].date);
            const isActualEnd = (ev.endDate || ev.date) === formatDate(week[ev.endIdx].date);
            const left = (ev.startIdx * 14.2857) + "%";
            const width = ((ev.endIdx - ev.startIdx + 1) * 14.2857) + "%";

            return (
                <div key={`${ev.id}-${i}`}
                     className={`event-bar ${ev.color} ${isActualStart ? 'start-round' : ''} ${isActualEnd ? 'end-round' : ''}`}
                     style={{
                         left: left,
                         width: width,
                         top: `${i * 35}px`, // 이벤트 바 사이 간격을 시원하게 조정
                     }}
                     onClick={(e) => { e.stopPropagation(); openModal(ev.refDate, ev); }}>
                    {ev.title || '(제목 없음)'}
                </div>
            );
        });
    };

    return (
        <div className="calendar-main-wrapper">
            <div className="weekdays-grid-header">
                {weekdays.map(d => <div key={d} className="day-header">{d}</div>)}
            </div>
            <div className="calendar-content-body">
                {rows.map((week, rIdx) => (
                    <div key={rIdx} className="calendar-row-container">
                        {week.map((item, i) => (
                            <div key={i} className={`day-cell ${!item.isCurrentMonth ? 'other-month' : ''} ${formatDate(new Date()) === formatDate(item.date) ? 'today-cell' : ''}`}
                                 onClick={() => openModal(formatDate(item.date))}>
                                <span className="day-label">{item.date.getDate()}</span>
                            </div>
                        ))}
                        <div className="event-overlay-layer">
                            {renderRowEvents(week)}
                        </div>
                    </div>
                ))}
            </div>
            {modalConfig.isOpen && <EventModal initData={modalConfig.event} onSave={onSave} onDelete={onDelete} onClose={closeModal} />}
        </div>
    );
}

export default CalendarSection;