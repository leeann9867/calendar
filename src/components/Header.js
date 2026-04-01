import React, { useState, useEffect, useRef } from 'react';

function Header({ currentDate, onPrev, onNext, onToday, onJump, theme, onToggleTheme, viewMode, setViewMode }) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const date = currentDate.getDate();

    const [showPicker, setShowPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(year);
    const pickerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); }
        if (showPicker) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPicker]);

    // 🌟 [핵심] 모바일 최적화를 위해 타이틀 길이 대폭 압축 (예: 2026.3 또는 2026.3.15)
    let titleText = `${year}.${month}`;
    if (viewMode === 'day') titleText = `${year}.${month}.${date}`;

    return (
        <div className="calendar-header">
            <div className="header-title-wrapper" ref={pickerRef}>
                <div className="header-title clickable" onClick={() => setShowPicker(!showPicker)}>
                    {titleText} <span className="dropdown-icon">▾</span>
                </div>

                {/* 미니 달력 팝업 */}
                {showPicker && (
                    <div className="date-picker-dropdown">
                        <div className="picker-year-row">
                            <button onClick={() => setPickerYear(pickerYear-1)}>&lt;</button>
                            <span>{pickerYear}년</span>
                            <button onClick={() => setPickerYear(pickerYear+1)}>&gt;</button>
                        </div>
                        <div className="picker-month-grid">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                <button
                                    key={m}
                                    className={`picker-month-btn ${year === pickerYear && month === m ? 'current' : ''}`}
                                    onClick={() => { onJump(pickerYear, m); setShowPicker(false); }}
                                >
                                    {m}월
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="nav-buttons">
                {/* 뷰 모드 토글 스위치 */}
                <div className="view-toggle-group">
                    <button className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>월</button>
                    <button className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>주</button>
                    <button className={`view-toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>일</button>
                </div>

                {/* 🌟 [핵심] 테마 버튼 글자 압축 (모드 글자 제거) */}
                <button className="theme-toggle" onClick={onToggleTheme}>
                    {theme === 'light' ? '🌙 다크' : '☀️ 라이트'}
                </button>
                <button className="header-btn" onClick={onToday}>오늘</button>
                <button className="header-btn" onClick={onPrev}>&lt;</button>
                <button className="header-btn" onClick={onNext}>&gt;</button>
            </div>
        </div>
    );
}

export default Header;