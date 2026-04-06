import React from 'react';
import { sortEvents } from '../../utils/calendarUtils'; // 🌟 정렬 함수 불러오기

function UpcomingEvents({ events }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    // 🌟 다가오는 일정을 시간순 & 하루종일 우선으로 완벽 정렬
    const upcomingEvents = sortEvents(events.filter(ev => ev.startDate > todayStr)).slice(0, 7);

    return (
        <div className="stat-group">
            <div className="side-panel-title" style={{ fontSize: '1.1rem', border: 'none', paddingBottom: '10px' }}>
                다가오는 일정
            </div>
            <div className="dday-container">
                {upcomingEvents.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>예정된 일정이 없습니다.</p>
                ) : (
                    upcomingEvents.map(ev => {
                        const evDate = new Date(ev.startDate);
                        evDate.setHours(0, 0, 0, 0);
                        const diff = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        return (
                            <div key={ev.id} className="dday-item-wrapper" style={{ borderLeftColor: ev.color || 'var(--sat-blue)' }}>
                                <div className="dday-item-header">
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ev.title}</span>
                                    <span className="dday-badge" style={{ backgroundColor: ev.color || 'var(--sat-blue)' }}>D-{diff}</span>
                                </div>
                                {/* 🌟 하루 종일 여부에 따라 텍스트 다르게 표기 */}
                                <div className="dday-item-time">
                                    {ev.startDate} ({ev.isAllDay ? '하루 종일' : `${ev.startTime || '00:00'} ~ ${ev.endTime || '23:59'}`})
                                </div>
                                {ev.memo && <div className="dday-item-memo">{ev.memo}</div>}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default UpcomingEvents;