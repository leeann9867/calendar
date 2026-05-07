import React, { useRef, useMemo } from 'react';
import { clearTime, getFormatDate, getInstancesForWeek, sortEvents } from '../../utils/calendarUtils';

/**
 * [TimeGridView Component]
 * 주간(Week) 및 일간(Day) 뷰 선택 시 나타나는 세로 타임라인(시간표) 달력 컴포넌트입니다.
 * - '하루 종일' 일정은 상단에 고정 영역(All-day row)에 가로로 표시됩니다.
 * - '시간 지정' 일정은 하단에 세로 타임라인을 따라 Y축 픽셀(px) 정밀 계산을 거쳐 블록으로 그려집니다.
 */
function TimeGridView({
                          currentDate, events, selectedTag, onOpenModal, onUpdateEventDate,
                          handleEventTouchStart, handleEventTouchMove, handleEventTouchEnd, viewMode,
                          onDeleteAllOnDate
                      }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const todayTime = clearTime(new Date());

    // =====================================================================
    // [롱터치(Long Press) 일괄 삭제 모듈] - 월간 뷰와 동일한 원리입니다.
    // =====================================================================
    const pressTimer = useRef(null);
    const isLongPressed = useRef(false);

    const startPress = (dayStr, targetEvents) => {
        isLongPressed.current = false;
        if (!targetEvents || targetEvents.length === 0) return;

        pressTimer.current = setTimeout(() => {
            isLongPressed.current = true;
            if (onDeleteAllOnDate) onDeleteAllOnDate(dayStr, targetEvents);
        }, 600);
    };

    const cancelPress = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    };

    const handleDateClick = (dayStr) => {
        if (isLongPressed.current) {
            isLongPressed.current = false;
            return;
        }
        onOpenModal(dayStr);
    };

    // 혹시 모를 대소문자 섞임이나 undefined 에러를 막기 위한 안전장치
    const safeViewMode = viewMode ? viewMode.toLowerCase() : 'week';
    const isWeek = safeViewMode === 'week';

    // =====================================================================
    // [렌더링 최적화 1] 상단 날짜 헤더 배열 계산 (useMemo 적용)
    // 주간(Week) 뷰면 일요일부터 7일치를, 일간(Day) 뷰면 오늘 하루치 1칸만 배열에 담습니다.
    // =====================================================================
    const days = useMemo(() => {
        const d = [];
        const start = new Date(currentDate);

        if (isWeek) {
            start.setDate(start.getDate() - start.getDay()); // 이번 주의 일요일로 맞춤
            for (let i = 0; i < 7; i++) {
                d.push(new Date(start));
                start.setDate(start.getDate() + 1);
            }
        } else {
            d.push(new Date(start)); // 일간 뷰는 그냥 기준 날짜 하루만 쏙 넣음
        }
        return d;
    }, [currentDate, isWeek]); // 날짜나 뷰 모드가 바뀔 때만 다시 배열을 만듭니다.

    // =====================================================================
    // [렌더링 최적화 2] 이벤트 인스턴스 전개 (useMemo 적용)
    // 주간/일간 화면 범위 내에 존재하는 모든 반복 일정 복제본들을 긁어모읍니다.
    // =====================================================================
    const allInstances = useMemo(() => {
        let instances = [];
        const viewStart = clearTime(days[0]); // 첫 날 (일요일 or 당일)
        const viewEnd = clearTime(days[days.length - 1]); // 마지막 날 (토요일 or 당일)

        events.forEach(ev => {
            instances = [...instances, ...getInstancesForWeek(ev, viewStart, viewEnd)];
        });
        return instances;
    }, [events, days]);

    // 0시부터 23시까지 타임라인의 좌측 시간표 라벨을 그리기 위한 24칸짜리 배열
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="time-grid-wrapper">
            {/* ==================== 상단 헤더 및 하루 종일(All-Day) 영역 ==================== */}
            <div className="time-grid-header">
                <div className="time-grid-header-spacer"></div> {/* 좌측 00:00 라벨들의 너비만큼 빈 공간을 밀어줌 */}

                {days.map((day, i) => {
                    const dayStr = getFormatDate(day);

                    // 1. 하루 종일 일정만 골라냄 (상단 가로 막대용)
                    const allDayEvents = sortEvents(allInstances.filter(ev => ev.startDate === dayStr && ev.isAllDay));
                    // 2. 시간 단위 일정도 골라냄 (일괄 삭제 시 "오늘 하루치 다 지워!"를 위해 묶음 데이터 생성 목적)
                    const timedEventsForHeader = allInstances.filter(ev => !ev.isAllDay && ev.startDate === dayStr);
                    // 3. 둘을 합쳐서 해당 날짜에 종속된 '모든 일정' 뭉치를 만듦
                    const allEventsOnThisDay = [...allDayEvents, ...timedEventsForHeader];

                    return (
                        <div
                            key={i} className="time-grid-column-header" data-date={dayStr}
                            // 하루 종일 영역(헤더)에 일정을 드롭했을 때의 처리 (정밀한 '시간'은 무시하고 '날짜'만 이동시킴)
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                            onDrop={(e) => {
                                e.preventDefault(); e.currentTarget.classList.remove('drag-over');
                                onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr); // 시간 없이 날짜만 던짐
                            }}
                        >
                            {/* 🌟 날짜와 요일이 적힌 부분 (여기를 꾹 누르면 일괄 삭제가 발동합니다) */}
                            <div
                                className={`time-grid-header-day ${clearTime(day) === todayTime ? 'today' : ''}`}
                                onMouseDown={() => startPress(dayStr, allEventsOnThisDay)}
                                onMouseUp={cancelPress}
                                onMouseLeave={cancelPress}
                                onTouchStart={() => startPress(dayStr, allEventsOnThisDay)}
                                onTouchEnd={cancelPress}
                                onClick={() => handleDateClick(dayStr)}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                <div>{weekdays[day.getDay()]}</div>
                                <div style={{ fontSize: '1.2rem' }}>{day.getDate()}</div>
                            </div>

                            {/* 하루 종일 일정들이 가로로 길게 깔리는 영역 */}
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

            {/* ==================== 하단 세로 타임라인(시간표) 영역 ==================== */}
            <div className="time-grid-body">
                {/* 좌측 Y축 시간 텍스트 라벨 (예: 09:00, 10:00) */}
                <div className="time-labels">
                    {hours.map(h => <div key={h} className="time-label-slot">{h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}</div>)}
                </div>

                {/* 실제 블록들이 그려지는 우측 넓은 영역 */}
                <div className="time-columns-container">
                    {/* 시간 구분을 위한 가로 옅은 안내선(Grid Line)들 */}
                    <div className="time-grid-lines">
                        {hours.map(h => <div key={h} className="time-grid-line"></div>)}
                    </div>

                    {days.map((day, i) => {
                        const dayStr = getFormatDate(day);
                        // 해당 날짜의 00시 00분 타임스탬프와 23시 59분 타임스탬프를 구함 (일정 포함 여부 검사용)
                        const dayStartMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0).getTime();
                        const dayEndMs = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59).getTime();

                        // 🌟 해당 날짜의 '시간이 지정된 일정(하루종일 아님)'만 쏙 골라서 필터링
                        const timedEvents = sortEvents(allInstances.filter(ev => {
                            if (ev.isAllDay || ev.startDate !== dayStr) return false; // 하루종일이나 다른 날짜면 탈락!

                            const sMs = new Date(`${ev.startDate}T${ev.startTime}:00`).getTime();
                            const eMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime}:00`).getTime();
                            // 일정이 해당 날짜 안에 조금이라도 걸쳐 있으면 통과
                            return sMs <= dayEndMs && eMs >= dayStartMs;
                        }));

                        return (
                            <div
                                key={i} data-date={dayStr} className="time-column" onClick={() => onOpenModal(dayStr)}

                                // 🌟 [핵심] 타임라인 기둥에 일정을 드롭했을 때, 마우스 Y좌표(px)를 정밀 분석하여 '시간'을 도출해내는 마법의 로직
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                onDrop={(e) => {
                                    e.preventDefault(); e.currentTarget.classList.remove('drag-over');
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const y = e.clientY - rect.top; // 컬럼 최상단(00시)부터 마우스가 떨어진 곳까지의 거리(px)

                                    // 1시간의 높이가 50px이므로, 50으로 나누면 '시간'이 나옵니다. (예: 120px / 50 = 2.4시간)
                                    const hourFloat = Math.max(0, y / 50);
                                    const snappedHour = Math.floor(hourFloat); // 정수부는 '시(Hour)' (예: 2시)

                                    // 소수부가 0.5(30분)를 넘으면 30분으로, 아니면 0분으로 '스냅(자석처럼 달라붙음)' 처리
                                    const snappedMin = (hourFloat % 1) >= 0.5 ? 30 : 0;

                                    // 09:30 포맷으로 예쁘게 조합하여 백엔드로 날림
                                    const newStartTime = `${String(Math.min(23, snappedHour)).padStart(2, '0')}:${String(snappedMin).padStart(2, '0')}`;
                                    onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr, newStartTime);
                                }}
                            >
                                {/* 🌟 필터링된 시간 지정 일정들을 세로 블록으로 화면에 그립니다. */}
                                {timedEvents.map(ev => {
                                    const sMs = new Date(`${ev.startDate}T${ev.startTime}:00`).getTime();
                                    const eMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime}:00`).getTime();

                                    // [Y축 시작 위치 공식] 시작 시(Hour) + (시작 분(Min) / 60) * 50px
                                    // 예: 10시 30분 -> (10 + 0.5) * 50 = 525px 위치에서 블록이 시작됨
                                    const topPx = (new Date(sMs).getHours() + new Date(sMs).getMinutes() / 60) * 50;

                                    // [블록 높이 공식] 두 시간의 차이(밀리초)를 1시간 단위로 바꾼 뒤 50px을 곱함
                                    // 너무 짧은 일정(예: 10분짜리)이 글씨조차 안 보일 만큼 찌그러지지 않도록 최소 높이를 25px(30분 어치)로 방어함 (Math.max)
                                    const heightPx = Math.max(((eMs - sMs) / (1000 * 60 * 60)) * 50, 25);

                                    const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

                                    return (
                                        <div
                                            key={`${ev.id}-${ev.startDate}`} className="time-event-block"
                                            draggable onDragStart={(e) => { e.dataTransfer.setData("eventId", ev.id); }}
                                            onTouchStart={(e) => handleEventTouchStart(e, ev)} onTouchMove={handleEventTouchMove} onTouchEnd={handleEventTouchEnd} onContextMenu={(e) => e.preventDefault()}

                                            // 위에서 계산한 top(시작위치)와 height(높이)를 CSS 인라인 스타일로 꽂아줍니다.
                                            style={{ top: `${topPx}px`, height: `${heightPx}px`, width: 'calc(100% - 8px)', backgroundColor: ev.color, opacity: isHighlighted ? 1 : 0.2 }}

                                            onClick={(e) => { e.stopPropagation(); onOpenModal(dayStr, ev); }}
                                        >
                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ev.repeatUnit && ev.repeatUnit !== 'none' && <span style={{marginRight:'3px'}}>🔁</span>}
                                                {ev.title}
                                            </div>
                                            {/* 일간(Day) 뷰일 때만 넓으니까 블록 안에 시작 시간을 작은 텍스트로 친절하게 보여줍니다. */}
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