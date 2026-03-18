import React from 'react';

/**
 * 전달받은 props를 사용하여 화면을 갱신함
 */
function Header({ currentDate, handleMoveMonth, handleGoToday }) {
    if (!currentDate) return null;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    return (
        <header className="calendar-header">
            <div className="current-month">{year}년 {month}월</div>
            <div className="nav-btns">
                <button onClick={() => handleMoveMonth(-1)}>&lt;</button>
                <button onClick={handleGoToday} className="today-btn">오늘</button>
                <button onClick={() => handleMoveMonth(1)}>&gt;</button>
            </div>
        </header>
    );
}

export default Header;