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
                    let sIdx = week.findIndex(d => formatDate(d.date) === ev.date);
                    if (sIdx === -1) sIdx = 0;
                    let eIdx = week.findIndex(d => formatDate(d.date) === (ev.endDate || ev.date));
                    if (eIdx === -1) eIdx = 6;
                    weekEvents.push({ ...ev, sIdx, eIdx, refDate: formatDate(day.date) });
                }
            });
        });

        return weekEvents.map((ev, i) => {
            const isStart = ev.date === formatDate(week[ev.sIdx].date);
            const isEnd = (ev.endDate || ev.date) === formatDate(week[ev.eIdx].date);
            const left = (ev.sIdx * (100 / 7)) + "%";
            const width = ((ev.eIdx - ev.sIdx + 1) * (100 / 7)) + "%";

            return (
                <div key={`${ev.id}-${i}`}
                     className={`event-bar ${ev.color} ${isStart ? 'start-round' : ''} ${isEnd ? 'end-round' : ''}`}
                     style={{ left, width, top: `${i * 34}px` }}
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
                        <div className="event-overlay-layer">{renderRowEvents(week)}</div>
                    </div>
                ))}
            </div>
            {modalConfig.isOpen && <EventModal initData={modalConfig.event} onSave={onSave} onDelete={onDelete} onClose={closeModal} />}
        </div>
    );
}

export default CalendarSection;