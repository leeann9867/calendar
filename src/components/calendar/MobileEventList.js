import React from 'react';

/**
 * [MobileEventList]
 * 모바일 화면(월간 뷰)에서 특정 날짜를 터치했을 때, 화면 하단에 나타나는 일정 목록 위젯입니다.
 */
function MobileEventList({
                             mobileSelectedDate,
                             events,
                             onOpenModal,
                             handleEventTouchStart,
                             handleEventTouchMove,
                             handleEventTouchEnd
                         }) {
    return (
        <div className="mobile-event-list-container">
            <h4 className="mobile-list-title">{mobileSelectedDate} 일정</h4>
            <div className="mobile-list-body">

                {events.length === 0 ? (
                    <p className="mobile-empty">일정이 없습니다.</p>
                ) : (
                    events.map(ev => (
                        <div
                            key={`${ev.id}-${ev.startDate}`}
                            className="mobile-list-item"
                            // 리스트의 항목을 꾹 누르면 드래그(Drag) 앤 드롭이 작동하도록 이벤트 연결
                            onTouchStart={(e) => handleEventTouchStart(e, ev)}
                            onTouchMove={handleEventTouchMove}
                            onTouchEnd={handleEventTouchEnd}
                            onContextMenu={(e) => e.preventDefault()} // 브라우저 기본 우클릭 메뉴 차단
                            onClick={() => onOpenModal(mobileSelectedDate, ev)}
                        >
                            {/* 좌측 색상 점 표기 */}
                            <div className="mobile-item-color" style={{ backgroundColor: ev.color }}></div>

                            <div className="mobile-item-info">
                                <strong>{ev.title}</strong>
                                <span>{ev.isAllDay ? '하루 종일' : `${ev.startTime || '00:00'} ~ ${ev.endTime || '23:59'}`}</span>

                                {/* 메모가 존재할 경우에만 메모 상자 렌더링 */}
                                {ev.memo && <div className="mobile-item-memo">{ev.memo}</div>}
                            </div>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
}

export default MobileEventList;