import React from 'react';
import { clearTime, getFormatDate, getInstancesForWeek, sortEvents } from '../../utils/calendarUtils';

/**
 * [TimeGridView]
 * 주간(Week) 및 일간(Day) 세로 타임라인 달력을 그리는 컴포넌트입니다.
 */
function TimeGridView({
                          currentDate, events, selectedTag, onOpenModal, onUpdateEventDate,
                          handleEventTouchStart, handleEventTouchMove, handleEventTouchEnd, viewMode
                      }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const todayTime = clearTime(new Date());

    const isWeek = viewMode === 'week';
    const days = [];
    const start = new Date(currentDate);
    if (isWeek) {
        start.setDate(start.getDate() - start.getDay());
        for (let i = 0; i < 7; i++) { days.push(new Date(start)); start.setDate(start.getDate() + 1); }
    } else {
        days.push(new Date(start));
    }

    const viewStart = clearTime(days[0]);
    const viewEnd = clearTime(days[days.length - 1]);
    let allInstances = [];
    events.forEach(ev => { allInstances = [...allInstances, ...getInstancesForWeek(ev, viewStart, viewEnd)]; });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="time-grid-wrapper">

            {/* ==================== 상단 헤더 및 하루 종일 영역 ==================== */}
            <div className="time-grid-header">
                <div className="time-grid-header-spacer"></div>
                {days.map((day, i) => {
                    const dayStr = getFormatDate(day);
                    const allDayEvents = sortEvents(allInstances.filter(ev => ev.startDate === dayStr && ev.isAllDay));

                    return (
                        <div
                            key={i}
                            className="time-grid-column-header"
                            data-date={dayStr}
                            // 🌟 [복구] 하루 종일 영역에 일정을 드롭했을 때의 처리
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                            onDrop={(e) => {
                                e.preventDefault(); e.currentTarget.classList.remove('drag-over');
                                onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr); // 시간 없이 날짜만 변경
                            }}
                        >
                            <div className={`time-grid-header-day ${clearTime(day) === todayTime ? 'today' : ''}`} onClick={() => onOpenModal(dayStr)}>
                                <div>{weekdays[day.getDay()]}</div>
                                <div style={{ fontSize: '1.2rem' }}>{day.getDate()}</div>
                            </div>

                            <div className="all-day-row">
                                {allDayEvents.map(ev => {
                                    // 🌟 [복구] 선택된 태그 강조 처리
                                    const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

                                    return (
                                        <div
                                            key={ev.id}
                                            className="all-day-item"
                                            // 🌟 [복구] 하루 종일 일정도 드래그 앤 드롭 가능하도록 처리
                                            draggable
                                            onDragStart={(e) => e.dataTransfer.setData("eventId", ev.id)}
                                            onTouchStart={(e) => handleEventTouchStart(e, ev)}
                                            onTouchMove={handleEventTouchMove}
                                            onTouchEnd={handleEventTouchEnd}
                                            onContextMenu={(e) => e.preventDefault()}
                                            style={{
                                                backgroundColor: ev.color,
                                                opacity: isHighlighted ? 1 : 0.2 // 태그 선택 시 투명도 처리
                                            }}
                                            onClick={(e) => { e.stopPropagation(); onOpenModal(dayStr, ev); }}
                                        >
                                            {ev.repeatUnit && ev.repeatUnit !== 'none' && <span style={{marginRight:'3px'}}>🔁</span>}
                                            {ev.title}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ==================== 하단 세로 타임라인 영역 ==================== */}
            <div className="time-grid-body">
                <div className="time-labels">
                    {hours.map(h => <div key={h} className="time-label-slot">{h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}</div>)}
                </div>
                <div className="time-columns-container">
                    <div className="time-grid-lines">
                        {hours.map(h => <div key={h} className="time-grid-line"></div>)}
                    </div>
                    {days.map((day, i) => {
                        const dayStr = getFormatDate(day);
                        const dayStartMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0).getTime();
                        const dayEndMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59).getTime();

                        const timedEvents = sortEvents(allInstances.filter(ev => {
                            if (ev.isAllDay || ev.startDate !== dayStr) return false;
                            const sMs = new Date(`${ev.startDate}T${ev.startTime}:00`).getTime();
                            const eMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime}:00`).getTime();
                            return sMs <= dayEndMs && eMs >= dayStartMs;
                        }));

                        return (
                            <div
                                key={i} data-date={dayStr} className="time-column" onClick={() => onOpenModal(dayStr)}
                                // 🌟 [복구] 타임라인에 일정 드롭 시 시간까지 정밀 계산해서 업데이트
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                onDrop={(e) => {
                                    e.preventDefault(); e.currentTarget.classList.remove('drag-over');
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const y = e.clientY - rect.top;
                                    const hourFloat = Math.max(0, y / 50);
                                    const snappedHour = Math.floor(hourFloat);
                                    const snappedMin = (hourFloat % 1) >= 0.5 ? 30 : 0;
                                    const newStartTime = `${String(Math.min(23, snappedHour)).padStart(2, '0')}:${String(snappedMin).padStart(2, '0')}`;
                                    onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr, newStartTime);
                                }}
                            >
                                {timedEvents.map(ev => {
                                    const sMs = new Date(`${ev.startDate}T${ev.startTime}:00`).getTime();
                                    const eMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime}:00`).getTime();
                                    const topPx = (new Date(sMs).getHours() + new Date(sMs).getMinutes() / 60) * 50;
                                    const heightPx = Math.max(((eMs - sMs) / (1000 * 60 * 60)) * 50, 25);

                                    // 🌟 [복구] 태그 필터링 시 투명도 조절
                                    const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

                                    return (
                                        <div
                                            key={`${ev.id}-${ev.startDate}`} className="time-event-block"
                                            // 🌟 [복구] 마우스 및 터치 드래그 앤 드롭 권한 부여
                                            draggable
                                            onDragStart={(e) => { e.dataTransfer.setData("eventId", ev.id); }}
                                            onTouchStart={(e) => handleEventTouchStart(e, ev)}
                                            onTouchMove={handleEventTouchMove}
                                            onTouchEnd={handleEventTouchEnd}
                                            onContextMenu={(e) => e.preventDefault()}
                                            style={{
                                                top: `${topPx}px`,
                                                height: `${heightPx}px`,
                                                width: 'calc(100% - 8px)',
                                                backgroundColor: ev.color,
                                                opacity: isHighlighted ? 1 : 0.2 // 태그 하이라이트 연동
                                            }}
                                            onClick={(e) => { e.stopPropagation(); onOpenModal(dayStr, ev); }}
                                        >
                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ev.repeatUnit && ev.repeatUnit !== 'none' && <span style={{marginRight:'3px'}}>🔁</span>}
                                                {ev.title}
                                            </div>
                                            {viewMode === 'day' && <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{ev.startTime}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default TimeGridView;