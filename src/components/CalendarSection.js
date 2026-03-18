import React, { useState } from 'react';
import EventModal from './EventModal';

function CalendarSection({ currentDate = new Date(), events = [], onSave, onDelete }) {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const isEventVisibleOn = (event, targetDate) => {
        const targetStr = formatDate(targetDate);
        const startStr = event.date;

        if (targetStr < startStr) return false;
        if (event.deletedDates && event.deletedDates.includes(targetStr)) return false;
        if (event.until && targetStr > event.until) return false;

        if (event.repeat === 'none') {
            const endStr = event.endDate || event.date;
            return targetStr >= startStr && targetStr <= endStr;
        }
        if (event.repeat === 'daily') return true;

        const t = new Date(targetStr);
        const s = new Date(startStr);

        if (event.repeat === 'weekly') return t.getDay() === s.getDay();
        if (event.repeat === 'monthly') return t.getDate() === s.getDate();

        if (event.repeat === 'custom') {
            const interval = parseInt(event.repeatInterval) || 1;
            const unit = event.repeatUnit || 'day';
            const diffTime = t.getTime() - s.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (unit === 'day') return diffDays % interval === 0;
            if (unit === 'week') return t.getDay() === s.getDay() && Math.floor(diffDays / 7) % interval === 0;
            if (unit === 'month') {
                const diffMonths = (t.getFullYear() - s.getFullYear()) * 12 + (t.getMonth() - s.getMonth());
                return t.getDate() === s.getDate() && diffMonths % interval === 0;
            }
        }
        return false;
    };

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

    const renderDayEvents = (day, dayIdx) => {
        const dayEvents = events.filter(ev => isEventVisibleOn(ev, day));
        return dayEvents.map((ev, order) => {
            const isContinuous = ev.repeat === 'daily' || (ev.repeat === 'none' && ev.endDate && ev.endDate !== ev.date);
            const yesterday = new Date(day);
            yesterday.setDate(day.getDate() - 1);
            const isStartOfBar = !isContinuous || (dayIdx % 7 === 0) || !isEventVisibleOn(ev, yesterday);

            if (isStartOfBar) {
                let duration = 0;
                const maxPossibleDays = 7 - (dayIdx % 7);
                for (let j = 0; j < maxPossibleDays; j++) {
                    const checkDay = new Date(day);
                    checkDay.setDate(day.getDate() + j);
                    if (isEventVisibleOn(ev, checkDay)) duration++; else break;
                }
                return (
                    <div key={`${ev.id}-${dayIdx}`} className={`event-bar ${ev.color}`}
                         style={{ top: `${order * 25 + 28}px`, width: `calc(${duration}00% + ${duration - 1}px)`, zIndex: 10 }}
                         onClick={(e) => {
                             e.stopPropagation();
                             const rect = e.currentTarget.parentElement.getBoundingClientRect();
                             const offsetDays = Math.floor((e.clientX - rect.left) / rect.width);
                             const clickedTargetDate = new Date(day); clickedTargetDate.setDate(day.getDate() + offsetDays);
                             setSelectedEvent(ev); setSelectedDate(formatDate(clickedTargetDate)); setShowModal(true);
                         }}>
                        {ev.title}
                    </div>
                );
            }
            return null;
        });
    };

    return (
        <main>
            <div className="calendar-wrapper">
                <div className="calendar-grid">
                    {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d} className="day-header">{d}</div>)}
                    {generateDays().map((item, i) => (
                        <div key={i} className={`day-column ${item.type !== 'current' ? 'other-month' : ''} ${formatDate(new Date()) === formatDate(item.date) ? 'today' : ''}`}
                             onClick={() => { setSelectedDate(formatDate(item.date)); setSelectedEvent(null); setShowModal(true); }}>
                            <span className="day-num">{item.date.getDate()}</span>
                            <div className="event-container">{renderDayEvents(item.date, i)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && <EventModal initData={selectedEvent ? { ...selectedEvent, date: selectedDate } : { date: selectedDate, endDate: selectedDate }} onSave={(data) => { onSave(data); setShowModal(false); }} onDelete={() => (!selectedEvent?.repeat || selectedEvent.repeat === 'none' ? (onDelete(selectedEvent.id), setShowModal(false)) : setShowDeleteConfirm(true))} onClose={() => setShowModal(false)} />}

            {showDeleteConfirm && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal delete-confirm-modal">
                        <h3>반복 일정 삭제</h3>
                        <div className="delete-options">
                            <button onClick={() => { onSave({ ...selectedEvent, deletedDates: [...(selectedEvent.deletedDates || []), selectedDate] }); setShowDeleteConfirm(false); setShowModal(false); }}>이 일정만 삭제</button>
                            <button onClick={() => { const prev = new Date(selectedDate); prev.setDate(prev.getDate() - 1); onSave({ ...selectedEvent, until: formatDate(prev) }); setShowDeleteConfirm(false); setShowModal(false); }}>이후 모든 일정 삭제</button>
                            <button onClick={() => { onDelete(selectedEvent.id); setShowDeleteConfirm(false); setShowModal(false); }}>전체 삭제</button>
                        </div>
                        <button className="btn-close" onClick={() => setShowDeleteConfirm(false)}>취소</button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default CalendarSection;