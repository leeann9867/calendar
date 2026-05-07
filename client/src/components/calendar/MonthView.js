import React, { useRef, useMemo } from 'react';
import { clearTime, getFormatDate, getInstancesForWeek, sortEvents } from '../../utils/calendarUtils';
import MobileEventList from './MobileEventList';

/**
 * [MonthView Component]
 * 캘린더의 가장 핵심이 되는 '월간(Month)' 달력 뷰를 렌더링합니다.
 * 데스크톱에서는 이벤트를 가로 막대(Bar)로 표시하고, 모바일에서는 점(Dot)으로 표시 후 하단에 리스트를 띄웁니다.
 */
function MonthView({
                       currentDate, events,
                       getHolidayName, // 🌟 부모(CalendarSection)로부터 공휴일 판별 마법 지팡이를 전달받았습니다!
                       selectedTag, onOpenModal, onUpdateEventDate,
                       isMobile, mobileSelectedDate, setMobileSelectedDate,
                       handleEventTouchStart, handleEventTouchMove, handleEventTouchEnd,
                       onDeleteAllOnDate
                   }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const todayTime = clearTime(new Date()); // 오늘 날짜를 하이라이트하기 위한 자정(00:00:00) 기준 타임스탬프

    // =====================================================================
    // [롱터치(Long Press) 일괄 삭제 모듈]
    // 모바일과 데스크톱 모두에서 날짜 칸을 0.6초간 꾹 누르면 일괄 삭제가 동작하도록 합니다.
    // =====================================================================
    const pressTimer = useRef(null);
    const isLongPressed = useRef(false);

    const startPress = (dayStr, dayEvents) => {
        isLongPressed.current = false;
        if (!dayEvents || dayEvents.length === 0) return;

        pressTimer.current = setTimeout(() => {
            isLongPressed.current = true;
            if (onDeleteAllOnDate) onDeleteAllOnDate(dayStr, dayEvents);
        }, 600);
    };

    const cancelPress = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    };

    const handleCellClick = (dayStr) => {
        if (isLongPressed.current) {
            isLongPressed.current = false;
            return;
        }
        if (isMobile) setMobileSelectedDate(dayStr);
        else onOpenModal(dayStr);
    };

    // =====================================================================
    // [렌더링 최적화 1] 달력 뼈대(42칸) 생성 (useMemo 적용)
    // =====================================================================
    const weeks = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month, 1);

        // 무조건 현재 달의 1일이 포함된 주의 '일요일'부터 달력이 시작되도록 오프셋 계산
        start.setDate(start.getDate() - start.getDay());

        const days = [];
        for (let i = 0; i < 42; i++) {
            days.push(new Date(start));
            start.setDate(start.getDate() + 1);
        }

        const wks = [];
        for (let i = 0; i < 42; i += 7) wks.push(days.slice(i, i + 7));
        return wks;
    }, [currentDate]);

    // =====================================================================
    // [렌더링 최적화 2] 반복 일정을 포함한 화면 내 전체 일정 전개 (useMemo 적용)
    // =====================================================================
    const allInstances = useMemo(() => {
        let instances = [];
        const viewStart = clearTime(weeks[0][0]);
        const viewEnd = clearTime(weeks[5][6]);

        events.forEach(ev => {
            instances = [...instances, ...getInstancesForWeek(ev, viewStart, viewEnd)];
        });

        return sortEvents(instances);
    }, [events, weeks]);

    // =====================================================================
    // [일정 가로 막대(Bar) 배치 알고리즘]
    // =====================================================================
    const renderEventsForWeek = (week) => {
        const weekStart = clearTime(week[0]);
        const weekEnd = clearTime(week[6]);

        // 해당 주에 단 하루라도 걸쳐 있는 이벤트들만 필터링
        const weekInstances = allInstances.filter(ev =>
            clearTime(new Date(ev.startDate)) <= weekEnd &&
            (ev.endDate ? clearTime(new Date(ev.endDate)) : clearTime(new Date(ev.startDate))) >= weekStart
        );

        const slots = [];

        return weekInstances.map((ev) => {
            const s = clearTime(new Date(ev.startDate));
            const e = ev.endDate ? clearTime(new Date(ev.endDate)) : s;

            // 이번 주 내에서 일정이 시작/종료되는 요일(0~6) 인덱스 도출
            let sIdx = week.findIndex(d => clearTime(d) === s);
            if (sIdx === -1) sIdx = 0;

            let eIdx = week.findIndex(d => clearTime(d) === e);
            if (eIdx === -1) eIdx = 6;

            // 다른 일정과 겹치지 않는 가장 낮은 Y축 빈자리(Slot) 탐색
            let slot = 0;
            while (slots[slot] !== undefined && slots[slot] >= sIdx) slot++;
            slots[slot] = eIdx;

            const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

            return (
                <div
                    key={`${ev.id}-${ev.startDate}`}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("eventId", ev.id); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        handleEventTouchStart(e, ev);
                    }}
                    onTouchMove={handleEventTouchMove}
                    onTouchEnd={handleEventTouchEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`event-bar ${s >= weekStart ? 'start-round' : ''} ${e <= weekEnd ? 'end-round' : ''}`}
                    style={{
                        left: `${sIdx * 14.28}%`,
                        width: `${(eIdx - sIdx + 1) * 14.28}%`,
                        top: `${slot * 30}px`,
                        backgroundColor: ev.color,
                        color: '#fff',
                        opacity: isHighlighted ? 1 : 0.15
                    }}
                    onClick={(e) => { e.stopPropagation(); onOpenModal(getFormatDate(new Date(ev.startDate)), ev); }}
                >
                    {ev.repeatUnit && ev.repeatUnit !== 'none' && <span style={{marginRight:'3px'}}>🔁</span>}
                    {!ev.isAllDay && ev.startTime && <span style={{fontSize: '0.65rem', marginRight: '4px', opacity: 0.85}}>{ev.startTime}</span>}
                    {ev.title}
                </div>
            );
        });
    };

    const mobileListEvents = allInstances.filter(ev => ev.startDate === mobileSelectedDate);

    return (
        <div className="calendar-section">
            {/* 최상단 요일 헤더 */}
            <div className="weekdays-grid" style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)'}}>
                {weekdays.map((d, i) => <div key={i} className={`weekday-cell ${i===0?'sun':i===6?'sat':''}`} style={{textAlign:'center', padding:'15px'}}>{d}</div>)}
            </div>

            <div className="days-grid" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                {weeks.map((week, wi) => (
                    <div key={wi} className="week-row">
                        {week.map((day, di) => {
                            const dayStr = getFormatDate(day);
                            const dayEvents = allInstances.filter(ev => ev.startDate === dayStr);
                            const isSelected = isMobile && dayStr === mobileSelectedDate;

                            // 🌟 핵심 로직: 현재 그리는 칸(dayStr)이 공휴일인지 훅을 통해 판별합니다!
                            const holidayName = getHolidayName ? getHolidayName(dayStr) : null;

                            return (
                                <div
                                    key={di}
                                    data-date={dayStr}
                                    // 🌟 휴일이면 'holiday' 클래스를 추가하여 CSS에서도 빨간색으로 제어되도록 보조합니다.
                                    className={`day-cell ${day.getMonth() !== currentDate.getMonth() ? 'other-month' : ''} ${di===0?'sun':di===6?'sat':''} ${clearTime(day) === todayTime ? 'today' : ''} ${isSelected ? 'mobile-selected' : ''} ${holidayName ? 'holiday' : ''}`}
                                    onMouseDown={() => startPress(dayStr, dayEvents)}
                                    onMouseUp={cancelPress}
                                    onMouseLeave={cancelPress}
                                    onTouchStart={() => startPress(dayStr, dayEvents)}
                                    onTouchEnd={cancelPress}
                                    onClick={() => handleCellClick(dayStr)}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                    onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr); }}
                                >
                                    {/* 🌟 날짜 렌더링 부위 개편: 휴일이면 숫자를 빨갛게 칠하고 이름을 표기합니다. */}
                                    <div className="day-header-wrapper" style={{ display: 'flex', alignItems: 'baseline', gap: '4px', paddingLeft: '4px' }}>
                                        <span
                                            className="day-number"
                                            style={{ color: holidayName ? 'var(--sun-red, #ff3b30)' : '' }}
                                        >
                                            {day.getDate()}
                                        </span>
                                        {holidayName && (
                                            <span
                                                className="holiday-name"
                                                style={{ color: 'var(--sun-red, #ff3b30)', fontSize: '0.65rem', fontWeight: '700', opacity: 0.9 }}
                                            >
                                                {holidayName}
                                            </span>
                                        )}
                                    </div>

                                    {/* 모바일 뷰일 경우 가로 막대 대신 작은 점(Dot) 최대 3개로 축약 표시 */}
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

                        {/* 날짜 박스들 위쪽 공중에 떠있는 형태(Position Absolute)로 이벤트 가로 막대 오버레이 렌더링 */}
                        <div className="events-layer">{renderEventsForWeek(week)}</div>
                    </div>
                ))}
            </div>

            {/* 모바일 전용 하단 리스트 (외부 컴포넌트로 분리됨) */}
            {isMobile && (
                <MobileEventList
                    mobileSelectedDate={mobileSelectedDate}
                    events={mobileListEvents}
                    onOpenModal={onOpenModal}
                    handleEventTouchStart={handleEventTouchStart}
                    handleEventTouchMove={handleEventTouchMove}
                    handleEventTouchEnd={handleEventTouchEnd}
                />
            )}
        </div>
    );
}

export default MonthView;