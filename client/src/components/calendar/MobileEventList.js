import React from 'react';

/**
 * [MobileEventList Component]
 * 모바일(화면 좁은 상태) 월간 뷰에서 특정 날짜를 터치했을 때,
 * 달력 하단에 나타나는 상세 일정 목록 바텀 시트(Bottom Sheet) 느낌의 위젯입니다.
 * @param {string} mobileSelectedDate - 현재 터치된 날짜 문자열 (YYYY-MM-DD)
 * @param {Array} events - 해당 날짜에 속한 일정들의 배열
 * @param {function} onOpenModal - 일정을 클릭했을 때 모달을 열기 위한 함수
 * @param {function} handleEventTouchStart - 모바일 롱프레스 드래그 시작 이벤트
 * @param {function} handleEventTouchMove - 모바일 롱프레스 드래그 이동 이벤트
 * @param {function} handleEventTouchEnd - 모바일 롱프레스 드래그 종료 이벤트
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

                {/* 선택한 날짜에 일정이 하나도 없을 때의 빈(Empty) 화면 처리 */}
                {events.length === 0 ? (
                    <p className="mobile-empty">일정이 없습니다.</p>
                ) : (
                    // 선택한 날짜의 이벤트들을 수직 리스트 형태로 매핑
                    events.map(ev => (
                        <div
                            key={`${ev.id}-${ev.startDate}`}
                            className="mobile-list-item"
                            // 리스트의 항목을 꾹 누르면 위쪽 달력 그리드로 자유롭게 던질 수 있도록(Drag & Drop) 제스처 엔진 연결
                            onTouchStart={(e) => handleEventTouchStart(e, ev)}
                            onTouchMove={handleEventTouchMove}
                            onTouchEnd={handleEventTouchEnd}
                            onContextMenu={(e) => e.preventDefault()} // 모바일 롱터치 시 브라우저 기본 우클릭 팝업 차단
                            onClick={() => onOpenModal(mobileSelectedDate, ev)} // 일반 클릭 시 수정/조회 모달 열기
                        >
                            {/* 좌측 이벤트 컬러 점(Dot) */}
                            <div className="mobile-item-color" style={{ backgroundColor: ev.color }}></div>

                            <div className="mobile-item-info">
                                <strong>{ev.title}</strong>
                                {/* 하루 종일 이벤트면 시간 대신 텍스트로 치환 */}
                                <span>{ev.isAllDay ? '하루 종일' : `${ev.startTime || '00:00'} ~ ${ev.endTime || '23:59'}`}</span>

                                {/* 메모가 존재할 때만 메모 박스 렌더링 */}
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