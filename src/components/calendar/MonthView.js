import React from 'react';
import { clearTime, getFormatDate, getInstancesForWeek, sortEvents } from '../../utils/calendarUtils';
import MobileEventList from './MobileEventList';

/**
 * [MonthView Component]
 * 캘린더의 가장 핵심이 되는 '월간(Month)' 달력 뷰를 렌더링합니다.
 * 데스크톱에서는 이벤트를 가로 막대(Bar)로 표시하고, 모바일에서는 점(Dot)으로 표시 후 하단에 리스트를 띄웁니다.
 * @param {Date} currentDate - 현재 캘린더가 가리키고 있는 기준 날짜
 * @param {Array} events - 필터링 및 검색이 완료된 이벤트 배열
 * @param {string|null} selectedTag - 우측 패널에서 선택된 태그 (하이라이트용)
 * @param {function} onOpenModal - 날짜나 이벤트를 클릭했을 때 모달을 여는 함수
 * @param {function} onUpdateEventDate - 드래그 앤 드롭으로 일정이 이동했을 때 호출되는 함수
 * @param {boolean} isMobile - 현재 화면이 모바일 해상도인지 여부
 * @param {string} mobileSelectedDate - 모바일에서 터치하여 선택한 날짜 (YYYY-MM-DD)
 * @param {function} setMobileSelectedDate - 모바일 선택 날짜 변경 함수
 * @param {function} handleEventTouchStart - 모바일 롱프레스 드래그 시작 이벤트
 * @param {function} handleEventTouchMove - 모바일 롱프레스 드래그 이동 이벤트
 * @param {function} handleEventTouchEnd - 모바일 롱프레스 드래그 종료 이벤트
 */
function MonthView({
                       currentDate, events, selectedTag, onOpenModal, onUpdateEventDate,
                       isMobile, mobileSelectedDate, setMobileSelectedDate,
                       handleEventTouchStart, handleEventTouchMove, handleEventTouchEnd
                   }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const todayTime = clearTime(new Date());

    // ========================================================
    // 1. 달력 날짜 그리드(Grid) 배열 생성 로직 (42칸 생성)
    // ========================================================
    const generateCalendar = () => {
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

        // 42일치 1차원 배열을 7칸씩 잘라 6주치 2차원 배열(weeks)로 변환
        const weeks = [];
        for (let i = 0; i < 42; i += 7) weeks.push(days.slice(i, i + 7));
        return weeks;
    };

    const weeks = generateCalendar();

    // ========================================================
    // 2. 화면 범위 내 유효한 이벤트 추출 및 렌더링 준비
    // ========================================================
    let allInstances = [];
    const viewStart = clearTime(weeks[0][0]);
    const viewEnd = clearTime(weeks[5][6]);

    events.forEach(ev => {
        allInstances = [...allInstances, ...getInstancesForWeek(ev, viewStart, viewEnd)];
    });

    // (하루종일 우선 -> 시간 우선) 규칙에 따라 정렬 처리
    allInstances = sortEvents(allInstances);

    // ========================================================
    // 3. 특정 주(Week)에 이벤트를 가로 막대(Bar)로 배치하는 알고리즘
    // ========================================================
    const renderEventsForWeek = (week) => {
        const weekStart = clearTime(week[0]);
        const weekEnd = clearTime(week[6]);

        // 해당 주에 단 하루라도 걸쳐 있는 이벤트들만 필터링
        const weekInstances = allInstances.filter(ev =>
            clearTime(new Date(ev.startDate)) <= weekEnd &&
            (ev.endDate ? clearTime(new Date(ev.endDate)) : clearTime(new Date(ev.startDate))) >= weekStart
        );

        const slots = []; // 일정이 Y축(세로)으로 겹칠 때 빈 층(Slot)을 계산하기 위한 배열

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
            slots[slot] = eIdx; // 해당 위치 선점

            const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

            return (
                <div
                    key={`${ev.id}-${ev.startDate}`}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("eventId", ev.id); }}
                    onTouchStart={(e) => handleEventTouchStart(e, ev)}
                    onTouchMove={handleEventTouchMove}
                    onTouchEnd={handleEventTouchEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`event-bar ${s >= weekStart ? 'start-round' : ''} ${e <= weekEnd ? 'end-round' : ''}`}
                    style={{
                        left: `${sIdx * 14.28}%`,            // 일요일부터 sIdx 칸만큼 우측으로 띄움 (1칸 = 14.28%)
                        width: `${(eIdx - sIdx + 1) * 14.28}%`, // 차지하는 일수만큼 너비 배정
                        top: `${slot * 30}px`,               // 빈자리(Slot) 층수마다 30px씩 밑으로 내림
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

            {/* 달력 본문 그리드 */}
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
                                    data-date={dayStr} // 마우스/터치로 일정을 집어서 가져다 놨을 때(Drop) 날짜를 인식하기 위한 데이터 속성
                                    className={`day-cell ${day.getMonth() !== currentDate.getMonth() ? 'other-month' : ''} ${di===0?'sun':di===6?'sat':''} ${clearTime(day) === todayTime ? 'today' : ''} ${isSelected ? 'mobile-selected' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                    onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr); }}
                                    onClick={() => { if (isMobile) setMobileSelectedDate(dayStr); else onOpenModal(dayStr); }}
                                >
                                    <span className="day-number">{day.getDate()}</span>

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