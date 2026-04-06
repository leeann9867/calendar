import React from 'react';
import { clearTime, getFormatDate, getInstancesForWeek, sortEvents } from '../../utils/calendarUtils';
import MobileEventList from './MobileEventList'; // 🌟 분리한 모바일 리스트 임포트

/**
 * [MonthView]
 * 캘린더의 기본 화면인 '월간(Month)' 뷰를 그리는 역할을 담당합니다.
 * 날짜 배열(42칸)을 생성하고, 이벤트들을 가로 막대(Event Bar) 형태로 배치합니다.
 */
function MonthView({
                       currentDate, events, selectedTag, onOpenModal, onUpdateEventDate,
                       isMobile, mobileSelectedDate, setMobileSelectedDate,
                       handleEventTouchStart, handleEventTouchMove, handleEventTouchEnd
                   }) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const todayTime = clearTime(new Date());

    // --------------------------------------------------------
    // 1. 6주(42칸) 달력 날짜 생성기
    // --------------------------------------------------------
    const generateCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month, 1);

        // 달력의 시작을 항상 해당 달 1일이 속한 주의 '일요일'로 맞춤
        start.setDate(start.getDate() - start.getDay());

        const days = [];
        for (let i = 0; i < 42; i++) {
            days.push(new Date(start));
            start.setDate(start.getDate() + 1); // 하루씩 증가
        }

        // 1차원 배열을 7일(1주)씩 잘라서 2차원 배열(weeks)로 만듦
        const weeks = [];
        for (let i = 0; i < 42; i += 7) weeks.push(days.slice(i, i + 7));
        return weeks;
    };

    const weeks = generateCalendar();

    // --------------------------------------------------------
    // 2. 현재 화면에 보일 이벤트 추출 및 정렬
    // --------------------------------------------------------
    let allInstances = [];
    const viewStart = clearTime(weeks[0][0]); // 화면 좌상단 날짜
    const viewEnd = clearTime(weeks[5][6]);   // 화면 우하단 날짜

    // 반복 일정을 풀어서 화면 안에 겹치는 것들만 다 쓸어담기
    events.forEach(ev => {
        allInstances = [...allInstances, ...getInstancesForWeek(ev, viewStart, viewEnd)];
    });

    // 시간 및 하루 종일 여부에 따라 일정 예쁘게 정렬
    allInstances = sortEvents(allInstances);

    // --------------------------------------------------------
    // 3. 특정 주(Week)에 들어갈 가로 막대(Event Bar) 렌더링 함수
    // --------------------------------------------------------
    const renderEventsForWeek = (week) => {
        const weekStart = clearTime(week[0]);
        const weekEnd = clearTime(week[6]);

        // 해당 주간 범위 안에 걸치는 일정들만 필터링
        const weekInstances = allInstances.filter(ev =>
            clearTime(new Date(ev.startDate)) <= weekEnd &&
            (ev.endDate ? clearTime(new Date(ev.endDate)) : clearTime(new Date(ev.startDate))) >= weekStart
        );

        const slots = []; // 일정이 겹칠 때 아래 칸으로 내리기 위한 슬롯(Y축) 배열

        return weekInstances.map((ev) => {
            const s = clearTime(new Date(ev.startDate));
            const e = ev.endDate ? clearTime(new Date(ev.endDate)) : s;

            // 시작점과 끝점이 달력의 어느 요일(0~6)에 걸쳐있는지 인덱스 계산
            let sIdx = week.findIndex(d => clearTime(d) === s);
            if (sIdx === -1) sIdx = 0; // 이번 주 이전부터 시작된 일정이면 0(일요일)부터 시작

            let eIdx = week.findIndex(d => clearTime(d) === e);
            if (eIdx === -1) eIdx = 6; // 다음 주로 넘어가는 일정이면 6(토요일)에서 컷

            // 겹치지 않는 빈 슬롯(층수) 찾기
            let slot = 0;
            while (slots[slot] !== undefined && slots[slot] >= sIdx) slot++;
            slots[slot] = eIdx; // 해당 슬롯을 차지함

            // 우측 패널에서 태그를 클릭했다면 다른 태그의 일정은 투명도(opacity)를 낮춰서 강조 효과 적용
            const isHighlighted = selectedTag ? ev.tag === selectedTag : true;

            return (
                <div
                    key={`${ev.id}-${ev.startDate}`}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("eventId", ev.id); }} // 데스크톱 드래그 앤 드롭
                    onTouchStart={(e) => handleEventTouchStart(e, ev)}                 // 모바일 롱프레스 드래그
                    onTouchMove={handleEventTouchMove}
                    onTouchEnd={handleEventTouchEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`event-bar ${s >= weekStart ? 'start-round' : ''} ${e <= weekEnd ? 'end-round' : ''}`} // 잘려나간 일정은 둥글기 제거
                    style={{
                        left: `${sIdx * 14.28}%`,
                        width: `${(eIdx - sIdx + 1) * 14.28}%`,
                        top: `${slot * 30}px`, // 한 층당 30px씩 밑으로 내림
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

    // 모바일 하단에 뿌려질 선택된 날짜의 일정 필터링
    const mobileListEvents = allInstances.filter(ev => ev.startDate === mobileSelectedDate);

    // --------------------------------------------------------
    // 4. 컴포넌트 렌더링 반환
    // --------------------------------------------------------
    return (
        <div className="calendar-section">
            {/* 최상단 요일 헤더 (일~토) */}
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
                                    data-date={dayStr} // 드롭(Drop) 영역 인식을 위한 속성
                                    className={`day-cell ${day.getMonth() !== currentDate.getMonth() ? 'other-month' : ''} ${di===0?'sun':di===6?'sat':''} ${clearTime(day) === todayTime ? 'today' : ''} ${isSelected ? 'mobile-selected' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                    onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); onUpdateEventDate(e.dataTransfer.getData("eventId"), dayStr); }}
                                    onClick={() => { if (isMobile) setMobileSelectedDate(dayStr); else onOpenModal(dayStr); }}
                                >
                                    <span className="day-number">{day.getDate()}</span>

                                    {/* 모바일 화면일 때, 날짜 밑에 일정이 있다는 뜻으로 점(dot) 표시 */}
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
                        {/* 만들어둔 가로 막대 이벤트들을 해당 주(Week) 위에 오버레이로 덮어씌움 */}
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