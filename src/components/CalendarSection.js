import React, { useState, useEffect, useRef } from 'react';
import MonthView from './calendar/MonthView';
import TimeGridView from './calendar/TimeGridView';
import { getFormatDate } from '../utils/calendarUtils';

function CalendarSection({ currentDate, events, selectedTag, onOpenModal, onUpdateEventDate, onPrev, onNext, viewMode }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileSelectedDate, setMobileSelectedDate] = useState(getFormatDate(new Date()));

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🌟 모바일 전용 롱프레스 터치 드래그 상태 관리
    const [touchDragInfo, setTouchDragInfo] = useState(null);
    const dragTimeoutRef = useRef(null);

    const handleEventTouchStart = (e, ev) => {
        const touch = e.touches[0];
        dragTimeoutRef.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setTouchDragInfo({ id: ev.id, title: ev.title, color: ev.color, x: touch.clientX, y: touch.clientY });
        }, 400);
    };

    const handleEventTouchMove = () => {
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

    // 🌟 터치 드래그 전역 이동 및 드롭 감지
    useEffect(() => {
        const handleGlobalTouchMove = (e) => {
            if (!touchDragInfo) return;
            e.preventDefault();
            const touch = e.touches[0];
            setTouchDragInfo(prev => ({ ...prev, x: touch.clientX, y: touch.clientY }));
        };

        const handleGlobalTouchEnd = (e) => {
            if (!touchDragInfo) return;
            const touch = e.changedTouches[0];
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

    // 🌟 스와이프 로직
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

    const swipeHandlers = {
        onTouchStart: (e) => handleDragStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY, e.target),
        onTouchMove: (e) => handleDragMove(e.targetTouches[0].clientX, e.targetTouches[0].clientY),
        onTouchEnd: handleDragEnd,
        onMouseDown: (e) => handleDragStart(e.clientX, e.clientY, e.target),
        onMouseMove: (e) => handleDragMove(e.clientX, e.clientY),
        onMouseUp: handleDragEnd,
        onMouseLeave: handleDragEnd
    };

    const sharedProps = {
        currentDate, events, selectedTag, onOpenModal, onUpdateEventDate,
        isMobile, mobileSelectedDate, setMobileSelectedDate,
        handleEventTouchStart, handleEventTouchMove, handleEventTouchEnd
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }} {...swipeHandlers}>
            {/* 🌟 뷰 모드에 따라 컴포넌트를 스위칭! */}
            {viewMode === 'month' ? (
                <MonthView {...sharedProps} />
            ) : (
                <TimeGridView {...sharedProps} viewMode={viewMode} />
            )}

            {/* 모바일 롱프레스 터치 드래그용 떠다니는 유령(Ghost) 요소 */}
            {touchDragInfo && (
                <div id="mobile-drag-ghost" style={{ position: 'fixed', left: touchDragInfo.x - 50, top: touchDragInfo.y - 20, width: '100px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: touchDragInfo.color, color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', zIndex: 99999, opacity: 0.9, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 10px' }}>
                    {touchDragInfo.title}
                </div>
            )}
        </div>
    );
}

export default CalendarSection;