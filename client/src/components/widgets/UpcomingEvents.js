import React from 'react';
import { sortEvents } from '../../utils/calendarUtils';

/**
 * [UpcomingEvents Widget]
 * 전체 이벤트 중 '내일 이후'에 예정된 다가오는 일정들만 필터링하여
 * D-Day(디데이) 형식으로 렌더링하는 위젯입니다. (최대 7개)
 */
function UpcomingEvents({ events }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 날짜 간의 순수 차이만 계산하기 위해 시/분/초 초기화

    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    // 오늘 문자열(todayStr)보다 날짜가 큰(미래인) 일정만 뽑은 뒤 시간순 정렬
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
                        // 이벤트 시작 날짜와 오늘 날짜 사이의 간격(차이)을 계산하여 D-N 형식으로 도출
                        const evDate = new Date(ev.startDate);
                        evDate.setHours(0, 0, 0, 0);
                        const diff = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        return (
                            <div key={ev.id} className="dday-item-wrapper" style={{ borderLeftColor: ev.color || 'var(--sat-blue)' }}>
                                <div className="dday-item-header">
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ev.title}</span>
                                    <span className="dday-badge" style={{ backgroundColor: ev.color || 'var(--sat-blue)' }}>D-{diff}</span>
                                </div>
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