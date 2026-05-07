import React, { useState, useRef, useEffect } from 'react';
// 🌟 아까 만든 icsUtils 파일에서 함수를 불러옵니다. 경로가 다르면 수정해주세요!
import { exportToICS, importFromICS } from '../utils/icsUtils';

/**
 * [Header]
 * 캘린더 상단의 네비게이션 및 컨트롤 패널을 담당하는 컴포넌트입니다.
 * - 날짜 이동 (이전, 다음, 오늘)
 * - 연도/월 빠른 이동 팝업 (Date Picker Dropdown)
 * - 뷰 모드 전환 (월간, 주간, 일간)
 * - ICS 일정 내보내기/가져오기 기능
 */
function Header({ currentDate, onPrev, onNext, onToday, onJump, viewMode, setViewMode, events, onImport }) {
    const [showPicker, setShowPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const getTitle = () => {
        if (viewMode === 'month') return `${year}년 ${month}월`;
        if (viewMode === 'week') {
            const start = new Date(currentDate);
            start.setDate(start.getDate() - start.getDay());
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            if (start.getMonth() !== end.getMonth()) {
                return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
            }
            return `${year}년 ${month}월`;
        }
        return `${year}년 ${month}월 ${currentDate.getDate()}일`;
    };

    // 🌟 ICS 파일 가져오기 핸들러
    const handleImportClick = (e) => {
        const file = e.target.files[0];
        if (file && onImport) {
            // DB 저장을 위해 부모(Main.js)에서 넘겨준 onImport 함수 실행
            importFromICS(file, onImport);
        }
        // 같은 파일을 다시 선택해도 반응하도록 input 초기화
        e.target.value = null;
    };

    return (
        <div className="calendar-header">
            <div className="nav-buttons">
                <div className="header-title-wrapper" ref={pickerRef}>
                    <h2 className="header-title clickable" onClick={() => { setPickerYear(year); setShowPicker(!showPicker); }}>
                        {getTitle()} <span className="dropdown-icon">▼</span>
                    </h2>

                    {showPicker && (
                        <div className="date-picker-dropdown">
                            <div className="picker-year-row">
                                <button onClick={() => setPickerYear(y => y - 1)}>◀</button>
                                <span>{pickerYear}년</span>
                                <button onClick={() => setPickerYear(y => y + 1)}>▶</button>
                            </div>
                            <div className="picker-month-grid">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
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

                <button className="header-btn" onClick={onToday}>오늘</button>

                {/* 🌟 ICS 버튼 영역 추가 (오늘 버튼 옆에 찰싹 붙어있습니다) */}
                <div style={{ display: 'flex', gap: '5px', marginLeft: '5px' }}>
                    <button
                        className="header-btn"
                        onClick={() => exportToICS(events || [])}
                        title="내보내기 (.ics)"
                        style={{ padding: '4px 10px' }}
                    >
                        ⬆️
                    </button>
                    <label
                        className="header-btn"
                        title="가져오기 (.ics)"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: '4px 10px' }}
                    >
                        ⬇️
                        <input type="file" accept=".ics" onChange={handleImportClick} style={{ display: 'none' }} />
                    </label>
                </div>
            </div>

            <div className="nav-buttons">
                <div className="view-toggle-group">
                    <button className={`view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>월</button>
                    <button className={`view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>주</button>
                    <button className={`view-toggle-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>일</button>
                </div>
                <button className="header-btn" onClick={onPrev}>◀</button>
                <button className="header-btn" onClick={onNext}>▶</button>
            </div>
        </div>
    );
}

export default Header;