import React from 'react';
import { useCalendar } from '../hooks/useCalendar';

/**
 * 상단 헤더 컴포넌트
 * 월 이동 및 오늘 이동 기능 담당
 */
function Header() {
    // 훅에서 직접 상태와 핸들러를 가져와 undefined 에러 방지
    const { currentDate, handleMoveMonth, handleGoToday } = useCalendar();

    // currentDate가 로드되기 전 예외 처리
    if (!currentDate) return null;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    return (
        <header className="calendar-header">
            <div className="current-month">
                {year}년 {month}월
            </div>
            <div className="nav-btns">
                <button onClick={() => handleMoveMonth(-1)}>&lt;</button>
                <button onClick={handleGoToday}>오늘</button>
                <button onClick={() => handleMoveMonth(1)}>&gt;</button>
            </div>
        </header>
    );
}

export default Header;