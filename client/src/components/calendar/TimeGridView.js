import React from 'react';
import { clearTime, getFormatDate, getInstancesForWeek, sortEvents } from '../../utils/calendarUtils';

/**
 * [TimeGridView Component]
 * 주간(Week) 및 일간(Day) 뷰 선택 시 나타나는 세로 타임라인 달력 컴포넌트입니다.
 * 하루 종일(All-day) 영역을 상단에 분리하여 고정하고,
 * 시간 단위 일정은 Y축 픽셀(px) 정밀 계산을 통해 시간표 블록으로 렌더링합니다.
 * @param {Date} currentDate - 기준 날짜
 * @param {Array} events - 필터링된 이벤트 배열
 * @param {string|null} selectedTag - 선택된 태그 (강조용)
 * @param {function} onOpenModal - 모달 열기 이벤트
 * @param {function} onUpdateEventDate - 드래그 앤 드롭 이동 시 시간/날짜 업데이트
 * @param {function} handleEventTouchStart - 모바일 드래그 시작 이벤트
 * @param {function} handleEventTouchMove - 모바일 드래그 이동 이벤트
 * @param {function} handleEventTouchEnd - 모바일 드래그 종료 이벤트
 * @param {string} viewMode - 현재 뷰 모드 ('week' 또는 'day')
 */
function TimeGridView({
                          currentDate, events, selectedTag, onOpenModal, onUpdateEventDate,
                          handleEventTouchStart, handleEventTouchMove, handleEventTouchEnd, viewMode
                      }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const todayTime = clearTime(new Date());

    // 1. 현재 뷰 모드에 따라 상단 헤더에 그릴 날짜 배열(days) 생성 (7칸 or 1칸)
    const isWeek = viewMode === 'week';
    const days = [];
    const start = new Date(currentDate);
    if (isWeek) {
        start.setDate(start.getDate() - start.getDay());
        for (let i = 0; i < 7; i++) { days.push(new Date(start)); start.setDate(start.getDate() + 1); }
    } else {
        days.push(new Date(start));
    }

    // 2. 화면에 보여줄 범위 내의 모든 반복 일정 인스턴스 전개
    const viewStart = clearTime(days[0]);
    const viewEnd = clearTime(days[days.length - 1]);
    let allInstances = [];
    events.forEach(ev => { allInstances = [...allInstances, ...getInstancesForWeek(ev, viewStart, viewEnd)]; });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="time-grid-wrapper">

            {/* ==================== 상단 헤더 및 하루 종일 영역 ==================== */}
            <div className="time-grid-header">
                <div className="time-grid-header-spacer"></div> {/* 좌측 시간축(00:00) 여백 공간 맞춤용 */}

                {days.map((day, i) => {
                    const dayStr = getFormatDate(day);
                    // 해당 날짜의 '하루 종일' 일정만 골라서 정렬
                    const allDayEvents = sortEvents(allInstances.filter(ev => ev.startDate === dayStr && ev.isAllDay));

                    return (
                        <div
                            key={i} className="time-grid-column-header" data-date={dayStr}
                            // 하루 종일 영역에 일정을 드롭했을 때의 처리 (시간 제거 후 날짜만 이동)
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                            onDrop={(e) => {
                                e.preventDefault(); e.currentTarget.classList.remove('drag-over');
                                onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr);
                            }}
                        >
                            <div className={`time-grid-header-day ${clearTime(day) === todayTime ? 'today' : ''}`} onClick={() => onOpenModal(dayStr)}>
                                <div>{weekdays[day.getDay()]}</div>
                                <div style={{ fontSize: '1.2rem' }}>{day.getDate()}</div>
                            </div>

                            <div className="all-day-row">
                                {allDayEvents.map(ev => {
                                    const isHighlighted = selectedTag ? ev.tag === selectedTag : true;
                                    return (
                                        <div
                                            key={ev.id} className="all-day-item" draggable
                                            onDragStart={(e) => e.dataTransfer.setData("eventId", ev.id)}
                                            onTouchStart={(e) => handleEventTouchStart(e, ev)} onTouchMove={handleEventTouchMove} onTouchEnd={handleEventTouchEnd}
                                            onContextMenu={(e) => e.preventDefault()}
                                            style={{ backgroundColor: ev.color, opacity: isHighlighted ? 1 : 0.2 }}
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
                {/* 좌측 Y축 시간 텍스트 (00:00 ~ 23:00) */}
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

                        // 해당 날짜의 '시간 지정 일정(하루 종일 아님)'만 골라서 필터링
                        const timedEvents = sortEvents(allInstances.filter(ev => {
                            if (ev.isAllDay || ev.startDate !== dayStr) return false;
                            const sMs = new Date(`${ev.startDate}T${ev.startTime}:00`).getTime();
                            const eMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime}:00`).getTime();
                            return sMs <= dayEndMs && eMs >= dayStartMs;
                        }));

                        return (
                            <div
                                key={i} data-date={dayStr} className="time-column" onClick={() => onOpenModal(dayStr)}
                                // 타임라인에 일정 드롭 시 Y축 픽셀(px)을 계산하여 드롭된 정밀한 '시간' 도출
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                onDrop={(e) => {
                                    e.preventDefault(); e.currentTarget.classList.remove('drag-over');
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const y = e.clientY - rect.top;

                                    // 50px = 1시간 기준으로 비례식 적용 -> 0.5시간 단위(30분)로 스냅 이동
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

                                    // 블록의 시작 위치(Top) 픽셀 계산: (시 + 분/60) * 50px
                                    const topPx = (new Date(sMs).getHours() + new Date(sMs).getMinutes() / 60) * 50;
                                    // 블록의 높이(Height) 픽셀 계산: 너무 찌그러지지 않게 최소 25px(30분 높이) 보장
                                    const heightPx = Math.max(((eMs - sMs) / (1000 * 60 * 60)) * 50, 25);

                                    const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

                                    return (
                                        <div
                                            key={`${ev.id}-${ev.startDate}`} className="time-event-block"
                                            draggable onDragStart={(e) => { e.dataTransfer.setData("eventId", ev.id); }}
                                            onTouchStart={(e) => handleEventTouchStart(e, ev)} onTouchMove={handleEventTouchMove} onTouchEnd={handleEventTouchEnd} onContextMenu={(e) => e.preventDefault()}
                                            style={{ top: `${topPx}px`, height: `${heightPx}px`, width: 'calc(100% - 8px)', backgroundColor: ev.color, opacity: isHighlighted ? 1 : 0.2 }}
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