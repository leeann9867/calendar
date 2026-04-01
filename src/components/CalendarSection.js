import React, { useState, useEffect, useRef } from 'react';

function CalendarSection({ currentDate, events, selectedTag, onOpenModal, onUpdateEventDate, onPrev, onNext, viewMode }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const clearTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const getFormatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const [mobileSelectedDate, setMobileSelectedDate] = useState(getFormatDate(new Date()));

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🌟 [핵심 1] 모바일 전용 롱프레스 터치 드래그 상태 관리
    const [touchDragInfo, setTouchDragInfo] = useState(null);
    const dragTimeoutRef = useRef(null);

    const handleEventTouchStart = (e, ev) => {
        const touch = e.touches[0];
        // 0.4초 꾹 누르면 드래그 모드로 진입
        dragTimeoutRef.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50); // 살짝 진동(지원하는 기기만)
            setTouchDragInfo({ id: ev.id, title: ev.title, color: ev.color, x: touch.clientX, y: touch.clientY });
        }, 400);
    };

    const handleEventTouchMove = () => {
        // 0.4초 전에 손가락을 움직이면(그냥 스크롤이면) 드래그 취소
        if (!touchDragInfo && dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }
    };

    const handleEventTouchEnd = () => {
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }
    };

    // 🌟 [핵심 2] 터치 드래그 이동 및 드롭 계산
    useEffect(() => {
        const handleGlobalTouchMove = (e) => {
            if (!touchDragInfo) return;
            e.preventDefault(); // 드래그 중에는 화면 스크롤 금지
            const touch = e.touches[0];
            setTouchDragInfo(prev => ({ ...prev, x: touch.clientX, y: touch.clientY }));
        };

        const handleGlobalTouchEnd = (e) => {
            if (!touchDragInfo) return;
            const touch = e.changedTouches[0];

            // 손가락이 떨어진 위치에 있는 요소를 찾음 (포인터 이벤트가 없는 고스트를 무시하고 캘린더 칸 감지)
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

            if (dropTarget) {
                const dayCell = dropTarget.closest('.day-cell');
                const timeCol = dropTarget.closest('.time-column');

                if (viewMode === 'month' && dayCell) {
                    const dateStr = dayCell.getAttribute('data-date');
                    if (dateStr) onUpdateEventDate(touchDragInfo.id, dateStr);
                } else if ((viewMode === 'week' || viewMode === 'day') && timeCol) {
                    const dateStr = timeCol.getAttribute('data-date');
                    if (dateStr) {
                        const rect = timeCol.getBoundingClientRect();
                        const y = touch.clientY - rect.top;
                        const hourFloat = Math.max(0, y / 50);
                        const snappedHour = Math.floor(hourFloat);
                        const snappedMin = (hourFloat % 1) >= 0.5 ? 30 : 0;
                        const newStartTime = `${String(Math.min(23, snappedHour)).padStart(2, '0')}:${String(snappedMin).padStart(2, '0')}`;
                        onUpdateEventDate(touchDragInfo.id, dateStr, newStartTime);
                    }
                }
            }
            setTouchDragInfo(null);
        };

        if (touchDragInfo) {
            window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
            window.addEventListener('touchend', handleGlobalTouchEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleGlobalTouchMove);
            window.removeEventListener('touchend', handleGlobalTouchEnd);
        };
    }, [touchDragInfo, viewMode, onUpdateEventDate]);

    // 기존 스와이프 감지 로직
    const [dragStart, setDragStart] = useState({ x: null, y: null });
    const [dragEnd, setDragEnd] = useState({ x: null, y: null });
    const [isDragging, setIsDragging] = useState(false);
    const minSwipeDistance = 50;

    const handleDragStart = (clientX, clientY, target) => {
        if (target.closest('.event-bar') || target.closest('.time-event-block') || target.closest('.mobile-list-item')) return;
        setDragEnd({ x: null, y: null });
        setDragStart({ x: clientX, y: clientY });
        setIsDragging(true);
    };
    const handleDragMove = (clientX, clientY) => {
        if (!isDragging) return;
        setDragEnd({ x: clientX, y: clientY });
    };
    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (!dragStart.x || !dragEnd.x) return;
        const distanceX = dragStart.x - dragEnd.x;
        const distanceY = dragStart.y - dragEnd.y;
        if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
            if (distanceX > 0) onNext();
            else onPrev();
        }
    };

    const onTouchStart = (e) => handleDragStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY, e.target);
    const onTouchMove = (e) => handleDragMove(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    const onTouchEnd = handleDragEnd;
    const onMouseDown = (e) => handleDragStart(e.clientX, e.clientY, e.target);
    const onMouseMove = (e) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = handleDragEnd;
    const onMouseLeave = handleDragEnd;

    const todayTime = clearTime(new Date());

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
            const diffDays = Math.round((clearTime(d) - clearTime(s)) / 86400000);

            if (ev.repeatUnit === 'day') {
                if (diffDays % interval === 0) isMatch = true;
            } else if (ev.repeatUnit === 'week') {
                if (d.getDay() === s.getDay() && (diffDays / 7) % interval === 0) isMatch = true;
            } else if (ev.repeatUnit === 'month') {
                const diffMonths = (d.getFullYear() - s.getFullYear()) * 12 + (d.getMonth() - s.getMonth());
                if (d.getDate() === s.getDate() && diffMonths >= 0 && diffMonths % interval === 0) isMatch = true;
            } else if (ev.repeatUnit === 'year') {
                const diffYears = d.getFullYear() - s.getFullYear();
                if (d.getMonth() === s.getMonth() && d.getDate() === s.getDate() && diffYears >= 0 && diffYears % interval === 0) isMatch = true;
            }

            if (isMatch) {
                instances.push({ ...ev, originalStartDate: ev.startDate, startDate: dateStr, endDate: getFormatDate(new Date(d.getTime() + duration)), isInstance: true });
            }
            checkDate.setDate(checkDate.getDate() + 1);
        }
        return instances;
    };

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

        let allInstances = [];
        const viewStart = clearTime(weeks[0][0]);
        const viewEnd = clearTime(weeks[5][6]);
        events.forEach(ev => { allInstances = [...allInstances, ...getInstancesForWeek(ev, viewStart, viewEnd)]; });
        allInstances.sort((a, b) => clearTime(new Date(a.startDate)) - clearTime(new Date(b.startDate)));

        const renderEventsForWeek = (week) => {
            const weekStart = clearTime(week[0]);
            const weekEnd = clearTime(week[6]);
            const weekInstances = allInstances.filter(ev => clearTime(new Date(ev.startDate)) <= weekEnd && (ev.endDate ? clearTime(new Date(ev.endDate)) : clearTime(new Date(ev.startDate))) >= weekStart);

            const slots = [];
            return weekInstances.map((ev) => {
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
                        onTouchStart={(e) => handleEventTouchStart(e, ev)}
                        onTouchMove={handleEventTouchMove}
                        onTouchEnd={handleEventTouchEnd}
                        onContextMenu={(e) => e.preventDefault()} // 롱프레스 시 브라우저 메뉴 차단
                        className={`event-bar ${s >= weekStart ? 'start-round' : ''} ${e <= weekEnd ? 'end-round' : ''}`}
                        style={{ left: `${sIdx * 14.28}%`, width: `${(eIdx - sIdx + 1) * 14.28}%`, top: `${slot * 30}px`, backgroundColor: ev.color, color: '#fff', opacity: isHighlighted ? 1 : 0.15 }}
                        onClick={(e) => { e.stopPropagation(); onOpenModal(getFormatDate(new Date(ev.startDate)), ev); }}
                    >
                        {ev.repeatUnit && ev.repeatUnit !== 'none' && <span>🔁 </span>}{ev.title}
                    </div>
                );
            });
        };

        const mobileListEvents = allInstances.filter(ev => ev.startDate === mobileSelectedDate);

        return (
            <div
                className="calendar-section"
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
            >
                <div className="weekdays-grid" style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)'}}>
                    {weekdays.map((d, i) => <div key={i} className={`weekday-cell ${i===0?'sun':i===6?'sat':''}`} style={{textAlign:'center', padding:'15px'}}>{d}</div>)}
                </div>
                <div className="days-grid">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="week-row">
                            {week.map((day, di) => {
                                const dayStr = getFormatDate(day);
                                const dayEvents = allInstances.filter(ev => ev.startDate === dayStr);
                                const isSelected = isMobile && dayStr === mobileSelectedDate;

                                return (
                                    <div
                                        key={di}
                                        data-date={dayStr} // 🌟 [핵심] 터치 드롭을 위한 날짜 속성 심기
                                        className={`day-cell ${day.getMonth() !== currentDate.getMonth() ? 'other-month' : ''} ${di===0?'sun':di===6?'sat':''} ${clearTime(day) === todayTime ? 'today' : ''} ${isSelected ? 'mobile-selected' : ''}`}
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                        onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr); }}
                                        onClick={() => {
                                            if (isMobile) setMobileSelectedDate(dayStr);
                                            else onOpenModal(dayStr);
                                        }}
                                    >
                                        <span className="day-number">{day.getDate()}</span>
                                        {isMobile && dayEvents.length > 0 && (
                                            <div className="mobile-dots">
                                                {dayEvents.slice(0, 3).map((ev, idx) => (
                                                    <span key={idx} style={{ backgroundColor: ev.color }}></span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="events-layer">{renderEventsForWeek(week)}</div>
                        </div>
                    ))}
                </div>

                {isMobile && (
                    <div className="mobile-event-list-container">
                        <h4 className="mobile-list-title">{mobileSelectedDate} 일정</h4>
                        <div className="mobile-list-body">
                            {mobileListEvents.length === 0 ? (
                                <p className="mobile-empty">일정이 없습니다.</p>
                            ) : (
                                mobileListEvents.map(ev => (
                                    <div
                                        key={`${ev.id}-${ev.startDate}`}
                                        className="mobile-list-item"
                                        onTouchStart={(e) => handleEventTouchStart(e, ev)} // 🌟 하단 리스트 항목도 드래그 가능!
                                        onTouchMove={handleEventTouchMove}
                                        onTouchEnd={handleEventTouchEnd}
                                        onContextMenu={(e) => e.preventDefault()}
                                        onClick={() => onOpenModal(mobileSelectedDate, ev)}
                                    >
                                        <div className="mobile-item-color" style={{ backgroundColor: ev.color }}></div>
                                        <div className="mobile-item-info">
                                            <strong>{ev.title}</strong>
                                            <span>{ev.startTime || '00:00'} ~ {ev.endTime || '23:59'}</span>
                                            {ev.memo && <div className="mobile-item-memo">{ev.memo}</div>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* 🌟 터치 드래그용 떠다니는 유령(Ghost) 요소 */}
                {touchDragInfo && (
                    <div id="mobile-drag-ghost" style={{ position: 'fixed', left: touchDragInfo.x - 50, top: touchDragInfo.y - 20, width: '100px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: touchDragInfo.color, color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', zIndex: 99999, opacity: 0.9, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 10px' }}>
                        {touchDragInfo.title}
                    </div>
                )}
            </div>
        );
    }

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
        <div
            className="time-grid-wrapper"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
        >
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

            <div className="time-grid-body">
                <div className="time-labels">
                    {hours.map(h => (
                        <div key={h} className="time-label-slot">{h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}</div>
                    ))}
                </div>

                <div className="time-columns-container">
                    <div className="time-grid-lines">
                        {hours.map(h => <div key={h} className="time-grid-line"></div>)}
                    </div>

                    {days.map((day, i) => {
                        const dayStr = getFormatDate(day);
                        const dayStartMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0).getTime();
                        const dayEndMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59).getTime();

                        const dayEvents = allInstances.filter(ev => {
                            const sTime = ev.startTime || '00:00';
                            const eTime = ev.endTime || '23:59';
                            const eStartMs = new Date(`${ev.startDate}T${sTime}:00`).getTime();
                            const eEndMs = new Date(`${ev.endDate || ev.startDate}T${eTime}:00`).getTime();
                            return eStartMs <= dayEndMs && eEndMs >= dayStartMs;
                        });

                        return (
                            <div
                                key={i}
                                data-date={dayStr} // 🌟 [핵심] 터치 드롭을 위한 날짜 속성 심기
                                className="time-column"
                                onClick={() => onOpenModal(dayStr)}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('drag-over');
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const y = e.clientY - rect.top;
                                    const hourFloat = Math.max(0, y / 50);
                                    const snappedHour = Math.floor(hourFloat);
                                    const snappedMin = (hourFloat % 1) >= 0.5 ? 30 : 0;
                                    const newStartTime = `${String(Math.min(23, snappedHour)).padStart(2, '0')}:${String(snappedMin).padStart(2, '0')}`;
                                    onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr, newStartTime);
                                }}
                            >
                                {dayEvents.map(ev => {
                                    const sTime = ev.startTime || '00:00';
                                    const eTime = ev.endTime || '23:59';
                                    const eStartMs = new Date(`${ev.startDate}T${sTime}:00`).getTime();
                                    const eEndMs = new Date(`${ev.endDate || ev.startDate}T${eTime}:00`).getTime();

                                    const renderStartMs = Math.max(eStartMs, dayStartMs);
                                    const renderEndMs = Math.min(eEndMs, dayEndMs);
                                    if (renderStartMs >= renderEndMs) return null;

                                    const renderStartObj = new Date(renderStartMs);
                                    const topPx = (renderStartObj.getHours() + renderStartObj.getMinutes() / 60) * 50;
                                    const durationHours = (renderEndMs - renderStartMs) / (1000 * 60 * 60);
                                    const heightPx = Math.max(durationHours * 50, 20);
                                    const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

                                    return (
                                        <div
                                            key={`${ev.id}-${ev.startDate}`}
                                            className="time-event-block"
                                            draggable
                                            onDragStart={(e) => { e.dataTransfer.setData("eventId", ev.id); }}
                                            onTouchStart={(e) => handleEventTouchStart(e, ev)} // 🌟 주/일간 뷰에서도 터치 드래그 지원
                                            onTouchMove={handleEventTouchMove}
                                            onTouchEnd={handleEventTouchEnd}
                                            onContextMenu={(e) => e.preventDefault()}
                                            style={{
                                                top: `${topPx}px`,
                                                height: `${heightPx}px`,
                                                left: '4px',
                                                width: 'calc(100% - 8px)',
                                                backgroundColor: ev.color,
                                                opacity: isHighlighted ? 1 : 0.2
                                            }}
                                            onClick={(e) => { e.stopPropagation(); onOpenModal(getFormatDate(new Date(ev.startDate)), ev); }}
                                        >
                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ev.repeatUnit && ev.repeatUnit !== 'none' && '🔁 '}{ev.title}
                                            </div>
                                            {viewMode === 'day' && (
                                                <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>
                                                    {sTime} ~ {eTime}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* 🌟 터치 드래그용 떠다니는 유령(Ghost) 요소 */}
                {touchDragInfo && (
                    <div id="mobile-drag-ghost" style={{ position: 'fixed', left: touchDragInfo.x - 50, top: touchDragInfo.y - 20, width: '100px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: touchDragInfo.color, color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', zIndex: 99999, opacity: 0.9, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 10px' }}>
                        {touchDragInfo.title}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CalendarSection;