import React from 'react';
import TodayEvents from './widgets/TodayEvents';
import UpcomingEvents from './widgets/UpcomingEvents';
import TagStats from './widgets/TagStats';

/**
 * [SidePanel]
 * 데스크톱 해상도에서 화면 우측에 나타나는 대시보드(Dashboard) 패널입니다.
 * 복잡한 로직을 수행하지 않고, 각자의 역할을 담당하는 위젯(Widget) 컴포넌트들을
 * 차례대로 조립(Assemble)하고 사이사이 구분선(Divider)을 그어주는 역할만 합니다.
 */
function SidePanel({ events, searchTerm, setSearchTerm, selectedTag, setSelectedTag }) {
    return (
        <div className="side-panel-container">
            <h3 className="side-panel-title">일정 관리</h3>

            {/* 🔍 1. 일정 및 태그 검색창 위젯 */}
            <div className="search-group">
                <input
                    type="text"
                    className="search-input"
                    placeholder="일정 또는 태그 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} // Main.js의 전역 상태(searchTerm) 업데이트
                />
            </div>

            {/* 📊 2. 전체 일정 개수 통계 */}
            <div className="stat-group" style={{ marginTop: '10px' }}>
                <div className="stat-row">
                    <span>전체 일정</span>
                    <strong>{events.length}건</strong>
                </div>
            </div>

            <div className="side-divider" />

            {/* 📅 3. 오늘의 일정 요약 위젯 */}
            <TodayEvents events={events} />

            <div className="side-divider" />

            {/* ⏳ 4. D-Day 다가오는 일정 위젯 */}
            <UpcomingEvents events={events} />

            <div className="side-divider" />

            {/* 🏷️ 5. 태그별 통계 및 필터링 위젯 */}
            <TagStats events={events} selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
        </div>
    );
}

export default SidePanel;