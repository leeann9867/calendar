import React from 'react';

function Header({ currentDate, onPrev, onNext, onToday }) {
    const formatDate = (date) => {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    };

    return (
        <header className="site-header">
            <div className="header-container">
                <div className="header-left">
                    <h1>Calendar</h1>
                    <button className="nav-btn" onClick={onToday}>오늘</button>
                    <div className="nav-controls">
                        <button className="nav-btn" onClick={onPrev}>&lt;</button>
                        <button className="nav-btn" onClick={onNext}>&gt;</button>
                    </div>
                    <span className="current-view-text">{formatDate(currentDate)}</span>
                </div>
                <div className="header-right"></div>
            </div>
        </header>
    );
}

export default Header;