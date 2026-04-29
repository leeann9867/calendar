import React from 'react';
import { sortEvents } from '../../utils/calendarUtils';

/**
 * [TodayEvents Widget]
 * 전체 이벤트 목록 중에서 오직 '오늘 날짜'의 일정만 뽑아내어
 * 시간순으로 예쁘게 렌더링하는 역할을 담당합니다. (최대 7개)
 */
function TodayEvents({ events }) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    // 오늘 날짜 문자열과 일치하는 일정만 필터링한 후, sortEvents 공통 함수로 시간순 정렬 적용
    const todayEvents = sortEvents(events.filter(ev => ev.startDate === todayStr)).slice(0, 7);

    return (
        <div className="stat-group">
            <div className="side-panel-title" style={{ fontSize: '1.1rem', border: 'none', paddingBottom: '10px', color: 'var(--sat-blue)' }}>
                오늘의 일정
            </div>
            <div className="dday-container">
                {todayEvents.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>오늘 예정된 일정이 없습니다.</p>
                ) : (
                    todayEvents.map(ev => (
                        // 일정의 색상(color)에 맞게 좌측 테두리 색상 강조
                        <div key={ev.id} className="dday-item-wrapper" style={{ borderLeftColor: ev.color || 'var(--sat-blue)', backgroundColor: 'var(--event-blue)' }}>
                            <div className="dday-item-header">
                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ev.title}</span>
                                <span className="dday-badge" style={{ backgroundColor: ev.color || 'var(--sat-blue)' }}>오늘</span>
                            </div>
                            {/* 하루 종일 일정이면 시간 텍스트 생략 */}
                            <div className="dday-item-time">
                                {ev.isAllDay ? '하루 종일' : `${ev.startTime || '00:00'} ~ ${ev.endTime || '23:59'}`}
                            </div>
                            {ev.memo && <div className="dday-item-memo">{ev.memo}</div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TodayEvents;