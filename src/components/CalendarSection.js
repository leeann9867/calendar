import React, { useState } from 'react';

function CalendarSection({ currentDate, events, selectedTag, onOpenModal, onUpdateEventDate, onPrev, onNext, viewMode }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) onNext();
        if (distance < -minSwipeDistance) onPrev();
    };

    const clearTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const getFormatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayTime = clearTime(new Date());

    // 반복 일정 계산 엔진 (기존과 완벽히 동일하여 모든 뷰에서 작동)
    const getInstancesForWeek = (ev, weekStart, weekEnd) => {
        const instances = [];
        const evStart = new Date(ev.startDate);
        const evEnd = new Date(ev.endDate || ev.startDate);
        const duration = evEnd.getTime() - evStart.getTime();
        const interval = parseInt(ev.repeatValue, 10) || 1;
        const exclusions = ev.excludedDates || [];
        const repeatEndDate = ev.repeatEndDate ? clearTime(new Date(ev.repeatEndDate)) : null;

        if (!ev.repeatUnit || ev.repeatUnit === 'none') {
            if (clearTime(evStart) <= weekEnd && clearTime(evEnd) >= weekStart) instances.push(ev);
            return instances;
        }

        let checkDate = new Date(weekStart);
        while (checkDate.getTime() <= weekEnd) {
            const d = checkDate;
            const s = evStart;
            const dateStr = getFormatDate(d);

            if (clearTime(d) < clearTime(s)) { checkDate.setDate(checkDate.getDate() + 1); continue; }
            if (repeatEndDate && clearTime(d) > repeatEndDate) break;
            if (exclusions.includes(dateStr)) { checkDate.setDate(checkDate.getDate() + 1); continue; }

            let isMatch = false;
            if (ev.repeatUnit === 'day') isMatch = Math.floor((clearTime(d) - clearTime(s)) / 86400000) % interval === 0;
            else if (ev.repeatUnit === 'week') isMatch = d.getDay() === s.getDay() && Math.floor((clearTime(d) - clearTime(s)) / 604800000) % interval === 0;
            else if (ev.repeatUnit === 'month') isMatch = d.getDate() === s.getDate() && ((d.getFullYear() - s.getFullYear()) * 12 + (d.getMonth() - s.getMonth())) >= 0 && ((d.getFullYear() - s.getFullYear()) * 12 + (d.getMonth() - s.getMonth())) % interval === 0;
            else if (ev.repeatUnit === 'year') isMatch = d.getMonth() === s.getMonth() && d.getDate() === s.getDate() && (d.getFullYear() - s.getFullYear()) >= 0 && (d.getFullYear() - s.getFullYear()) % interval === 0;

            if (isMatch) {
                instances.push({ ...ev, originalStartDate: ev.startDate, startDate: dateStr, endDate: getFormatDate(new Date(d.getTime() + duration)), isInstance: true });
            }
            checkDate.setDate(checkDate.getDate() + 1);
        }
        return instances;
    };

    // --------------------------------------------------------
    // 뷰 모드 1: 월간 (Month) 렌더링 로직 (기존 유지)
    // --------------------------------------------------------
    if (viewMode === 'month') {
        const generateCalendar = () => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const start = new Date(year, month, 1);
            start.setDate(start.getDate() - start.getDay());
            const days = [];
            for (let i = 0; i < 42; i++) { days.push(new Date(start)); start.setDate(start.getDate() + 1); }
            const weeks = [];
            for (let i = 0; i < 42; i += 7) weeks.push(days.slice(i, i + 7));
            return weeks;
        };
        const weeks = generateCalendar();

        const renderEventsForWeek = (week) => {
            const weekStart = clearTime(week[0]);
            const weekEnd = clearTime(week[6]);
            let allInstances = [];
            events.forEach(ev => { allInstances = [...allInstances, ...getInstancesForWeek(ev, weekStart, weekEnd)]; });
            allInstances.sort((a, b) => clearTime(new Date(a.startDate)) - clearTime(new Date(b.startDate)));

            const slots = [];
            return allInstances.map((ev) => {
                const s = clearTime(new Date(ev.startDate));
                const e = ev.endDate ? clearTime(new Date(ev.endDate)) : s;
                let sIdx = week.findIndex(d => clearTime(d) === s);
                if (sIdx === -1) sIdx = 0;
                let eIdx = week.findIndex(d => clearTime(d) === e);
                if (eIdx === -1) eIdx = 6;
                let slot = 0;
                while (slots[slot] !== undefined && slots[slot] >= sIdx) slot++;
                slots[slot] = eIdx;
                const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

                return (
                    <div
                        key={`${ev.id}-${ev.startDate}`} draggable
                        onDragStart={(e) => { e.dataTransfer.setData("eventId", ev.id); }}
                        className={`event-bar ${s >= weekStart ? 'start-round' : ''} ${e <= weekEnd ? 'end-round' : ''}`}
                        style={{ left: `${sIdx * 14.28}%`, width: `${(eIdx - sIdx + 1) * 14.28}%`, top: `${slot * 30}px`, backgroundColor: ev.color, color: '#fff', opacity: isHighlighted ? 1 : 0.15 }}
                        onClick={(e) => { e.stopPropagation(); onOpenModal(getFormatDate(new Date(ev.startDate)), ev); }}
                    >
                        {ev.repeatUnit && ev.repeatUnit !== 'none' && <span>🔁 </span>}{ev.title}
                    </div>
                );
            });
        };

        return (
            <div className="calendar-section" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                <div className="weekdays-grid" style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)'}}>
                    {weekdays.map((d, i) => <div key={i} className={`weekday-cell ${i===0?'sun':i===6?'sat':''}`} style={{textAlign:'center', padding:'15px'}}>{d}</div>)}
                </div>
                <div className="days-grid">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="week-row">
                            {week.map((day, di) => (
                                <div
                                    key={di} className={`day-cell ${day.getMonth() !== currentDate.getMonth() ? 'other-month' : ''} ${di===0?'sun':di===6?'sat':''} ${clearTime(day) === todayTime ? 'today' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                    onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); onUpdateEventDate(e.dataTransfer.getData("eventId"), getFormatDate(day)); }}
                                    onClick={() => onOpenModal(getFormatDate(day))}
                                ><span className="day-number">{day.getDate()}</span></div>
                            ))}
                            <div className="events-layer">{renderEventsForWeek(week)}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --------------------------------------------------------
    // 🌟 뷰 모드 2: 주간(Week) / 일간(Day) 타임 그리드 렌더링 로직
    // --------------------------------------------------------
    const isWeek = viewMode === 'week';
    const days = [];
    const start = new Date(currentDate);

    if (isWeek) {
        start.setDate(start.getDate() - start.getDay()); // 일요일로 맞춤
        for (let i = 0; i < 7; i++) { days.push(new Date(start)); start.setDate(start.getDate() + 1); }
    } else {
        days.push(new Date(start)); // 일간 뷰는 현재 날짜 1개만
    }

    const viewStart = clearTime(days[0]);
    const viewEnd = clearTime(days[days.length - 1]);

    let allInstances = [];
    events.forEach(ev => { allInstances = [...allInstances, ...getInstancesForWeek(ev, viewStart, viewEnd)]; });

    // 세로 시간 라벨 (00:00 ~ 23:00)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="time-grid-wrapper" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

            {/* 타임 그리드 헤더 (요일/날짜) */}
            <div className="time-grid-header">
                <div className="time-grid-header-spacer"></div>
                {days.map((day, i) => (
                    <div
                        key={i}
                        className={`time-grid-header-day ${clearTime(day) === todayTime ? 'today' : ''}`}
                        onClick={() => onOpenModal(getFormatDate(day))}
                    >
                        <div>{weekdays[day.getDay()]}</div>
                        <div style={{ fontSize: '1.2rem' }}>{day.getDate()}</div>
                    </div>
                ))}
            </div>

            {/* 타임 그리드 바디 (시간대 및 이벤트 블록) */}
            <div className="time-grid-body">
                {/* 좌측 시간축 */}
                <div className="time-labels">
                    {hours.map(h => (
                        <div key={h} className="time-label-slot">
                            {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
                        </div>
                    ))}
                </div>

                {/* 우측 요일 컬럼들 */}
                <div className="time-columns-container">
                    {/* 눈금선 배경 */}
                    <div className="time-grid-lines">
                        {hours.map(h => <div key={h} className="time-grid-line"></div>)}
                    </div>

                    {days.map((day, i) => {
                        const dayStartMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0).getTime();
                        const dayEndMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59).getTime();

                        // 이 요일에 해당하는 이벤트 필터링 및 높이/위치 계산
                        const dayEvents = allInstances.filter(ev => {
                            const sTime = ev.startTime || '00:00';
                            const eTime = ev.endTime || '23:59';
                            const eStartMs = new Date(`${ev.startDate}T${sTime}:00`).getTime();
                            const eEndMs = new Date(`${ev.endDate || ev.startDate}T${eTime}:00`).getTime();
                            // 이벤트가 이 날짜와 겹치는지 확인
                            return eStartMs <= dayEndMs && eEndMs >= dayStartMs;
                        });

                        return (
                            <div
                                key={i} className="time-column"
                                onClick={(e) => {
                                    // 클릭한 위치를 계산해 대략적인 시간으로 모달 띄우기 기능도 가능하지만, 기본적으로는 해당 날짜로 모달 오픈
                                    onOpenModal(getFormatDate(day));
                                }}
                            >
                                {dayEvents.map(ev => {
                                    const sTime = ev.startTime || '00:00';
                                    const eTime = ev.endTime || '23:59';
                                    const eStartMs = new Date(`${ev.startDate}T${sTime}:00`).getTime();
                                    const eEndMs = new Date(`${ev.endDate || ev.startDate}T${eTime}:00`).getTime();

                                    // 이벤트가 해당 날짜 범위를 넘어가면 자름 (00:00 ~ 23:59 내부로 제한)
                                    const renderStartMs = Math.max(eStartMs, dayStartMs);
                                    const renderEndMs = Math.min(eEndMs, dayEndMs);

                                    if (renderStartMs >= renderEndMs) return null; // 유효하지 않은 시간 (자정 딱 맞물리는 경우 등)

                                    const renderStartObj = new Date(renderStartMs);
                                    // Top 위치: 시간 단위 * 50px
                                    const topPx = (renderStartObj.getHours() + renderStartObj.getMinutes() / 60) * 50;
                                    // 높이: (끝시간 - 시작시간) / 1시간 * 50px
                                    const durationHours = (renderEndMs - renderStartMs) / (1000 * 60 * 60);
                                    const heightPx = Math.max(durationHours * 50, 20); // 최소 높이 20px 보장

                                    const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

                                    return (
                                        <div
                                            key={`${ev.id}-${ev.startDate}`}
                                            className="time-event-block"
                                            style={{ top: `${topPx}px`, height: `${heightPx}px`, backgroundColor: ev.color, opacity: isHighlighted ? 1 : 0.2 }}
                                            onClick={(e) => { e.stopPropagation(); onOpenModal(getFormatDate(new Date(ev.startDate)), ev); }}
                                        >
                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ev.repeatUnit && ev.repeatUnit !== 'none' && '🔁 '}{ev.title}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                                {sTime} ~ {eTime}
                                            </div>
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

export default CalendarSection;