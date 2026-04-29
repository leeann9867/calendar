import React, { useState, useEffect, useRef } from 'react';
import MonthView from './calendar/MonthView';
import TimeGridView from './calendar/TimeGridView';
import { getFormatDate } from '../utils/calendarUtils';

/**
 * [CalendarSection]
 * 달력 영역의 최상위 래퍼(Wrapper) 컴포넌트입니다.
 * 1. 모바일 환경의 '롱프레스 드래그 앤 드롭' 및 '스와이프(Swipe)' 제스처를 감지합니다.
 * 2. 현재 뷰 모드(Month, Week, Day)에 따라 적절한 하위 달력 컴포넌트를 스위칭하여 렌더링합니다.
 */
function CalendarSection({ currentDate, events, selectedTag, onOpenModal, onUpdateEventDate, onPrev, onNext, viewMode }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileSelectedDate, setMobileSelectedDate] = useState(getFormatDate(new Date()));

    // 윈도우 리사이즈 시 모바일 여부 판별
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // =====================================================================
    // [엔진 1] 모바일 전용 롱프레스 터치 드래그 앤 드롭 상태 관리
    // =====================================================================
    const [touchDragInfo, setTouchDragInfo] = useState(null); // 현재 드래그 중인 이벤트 정보
    const dragTimeoutRef = useRef(null); // 롱프레스 타이머

    // 터치 시작: 0.4초 동안 꾹 누르고 있으면 드래그 모드로 진입
    const handleEventTouchStart = (e, ev) => {
        const touch = e.touches[0];
        dragTimeoutRef.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50); // 햅틱 피드백 지원
            setTouchDragInfo({ id: ev.id, title: ev.title, color: ev.color, x: touch.clientX, y: touch.clientY });
        }, 400);
    };

    // 터치 이동: 0.4초 전에 손가락을 움직이면 단순 화면 스크롤로 간주하고 드래그 취소
    const handleEventTouchMove = () => {
        if (!touchDragInfo && dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }
    };

    // 터치 종료: 타이머 초기화
    const handleEventTouchEnd = () => {
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }
    };

    // 터치 드래그 전역(Global) 이동 및 드롭(Drop) 감지 로직
    useEffect(() => {
        const handleGlobalTouchMove = (e) => {
            if (!touchDragInfo) return;
            e.preventDefault(); // 드래그 중에는 기본 화면 스크롤 강제 차단
            const touch = e.touches[0];
            setTouchDragInfo(prev => ({ ...prev, x: touch.clientX, y: touch.clientY }));
        };

        const handleGlobalTouchEnd = (e) => {
            if (!touchDragInfo) return;
            const touch = e.changedTouches[0];

            // 손가락이 떨어진 위치의 DOM 요소를 추적하여 어느 날짜(시간) 칸인지 판별
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

            if (dropTarget) {
                const dayCell = dropTarget.closest('.day-cell'); // 월간 뷰의 셀
                const timeCol = dropTarget.closest('.time-column'); // 주간/일간 뷰의 세로 타임라인 기둥

                if (viewMode === 'month' && dayCell) {
                    // 월간 뷰: 해당 셀의 data-date 속성을 읽어와서 날짜만 업데이트
                    const dateStr = dayCell.getAttribute('data-date');
                    if (dateStr) onUpdateEventDate(touchDragInfo.id, dateStr);
                } else if ((viewMode === 'week' || viewMode === 'day') && timeCol) {
                    // 주간/일간 뷰: Y축 픽셀 좌표를 계산하여 드롭된 정밀한 '시간'까지 계산
                    const dateStr = timeCol.getAttribute('data-date');
                    if (dateStr) {
                        const rect = timeCol.getBoundingClientRect();
                        const y = touch.clientY - rect.top;
                        const hourFloat = Math.max(0, y / 50); // 50px = 1시간
                        const snappedHour = Math.floor(hourFloat);
                        const snappedMin = (hourFloat % 1) >= 0.5 ? 30 : 0; // 30분 단위 스냅
                        const newStartTime = `${String(Math.min(23, snappedHour)).padStart(2, '0')}:${String(snappedMin).padStart(2, '0')}`;
                        onUpdateEventDate(touchDragInfo.id, dateStr, newStartTime);
                    }
                }
            }
            setTouchDragInfo(null); // 드래그 상태 초기화
        };

        // 이벤트 리스너 등록 (드래그 중에만 활성화하여 성능 최적화)
        if (touchDragInfo) {
            window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
            window.addEventListener('touchend', handleGlobalTouchEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleGlobalTouchMove);
            window.removeEventListener('touchend', handleGlobalTouchEnd);
        };
    }, [touchDragInfo, viewMode, onUpdateEventDate]);

    // =====================================================================
    // [엔진 2] 달력 좌우 스와이프(이전/다음 달 넘기기) 제스처 감지
    // =====================================================================
    const [dragStart, setDragStart] = useState({ x: null, y: null });
    const [dragEnd, setDragEnd] = useState({ x: null, y: null });
    const [isDragging, setIsDragging] = useState(false);
    const minSwipeDistance = 50; // 스와이프 인식 최소 거리(px)

    const handleDragStart = (clientX, clientY, target) => {
        // 이벤트 바나 모바일 리스트 내부를 터치한 경우는 달력 스와이프를 무시함
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

        // 수직 이동보다 수평 이동이 더 길고, 최소 거리 이상 스와이프했을 경우 달력 넘김 처리
        if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
            if (distanceX > 0) onNext();
            else onPrev();
        }
    };

    const swipeHandlers = {
        onTouchStart: (e) => handleDragStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY, e.target),
        onTouchMove: (e) => handleDragMove(e.targetTouches[0].clientX, e.targetTouches[0].clientY),
        onTouchEnd: handleDragEnd,
        onMouseDown: (e) => handleDragStart(e.clientX, e.clientY, e.target),
        onMouseMove: (e) => handleDragMove(e.clientX, e.clientY),
        onMouseUp: handleDragEnd,
        onMouseLeave: handleDragEnd
    };

    // 하위 컴포넌트로 내려줄 공통 프롭스 묶음
    const sharedProps = {
        currentDate, events, selectedTag, onOpenModal, onUpdateEventDate,
        isMobile, mobileSelectedDate, setMobileSelectedDate,
        handleEventTouchStart, handleEventTouchMove, handleEventTouchEnd
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }} {...swipeHandlers}>

            {/* 🌟 뷰 모드에 따라 알맞은 캘린더 컴포넌트 렌더링 */}
            {viewMode === 'month' ? (
                <MonthView {...sharedProps} />
            ) : (
                <TimeGridView {...sharedProps} viewMode={viewMode} />
            )}

            {/* 모바일 롱프레스 터치 드래그 시 커서(손가락)를 따라다니는 고스트(Ghost) 엘리먼트 UI */}
            {touchDragInfo && (
                <div id="mobile-drag-ghost" style={{
                    position: 'fixed', left: touchDragInfo.x - 50, top: touchDragInfo.y - 20,
                    width: '100px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: touchDragInfo.color, color: '#fff', borderRadius: '8px',
                    fontSize: '0.85rem', fontWeight: '700', zIndex: 99999, opacity: 0.9,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 10px'
                }}>
                    {touchDragInfo.title}
                </div>
            )}
        </div>
    );
}

export default CalendarSection;