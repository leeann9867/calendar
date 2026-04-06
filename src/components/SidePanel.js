import React from 'react';
import TodayEvents from './widgets/TodayEvents';
import UpcomingEvents from './widgets/UpcomingEvents';
import TagStats from './widgets/TagStats';

function SidePanel({ events, searchTerm, setSearchTerm, selectedTag, setSelectedTag }) {
    return (
        <div className="side-panel-container">
            <h3 className="side-panel-title">일정 관리</h3>

            {/* 🔍 1. 검색 위젯 */}
            <div className="search-group">
                <input
                    type="text"
                    className="search-input"
                    placeholder="일정 또는 태그 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="stat-group" style={{ marginTop: '10px' }}>
                <div className="stat-row">
                    <span>전체 일정</span>
                    <strong>{events.length}건</strong>
                </div>
            </div>

            <div className="side-divider" />

            {/* 📅 2. 오늘의 일정 위젯 */}
            <TodayEvents events={events} />

            <div className="side-divider" />

            {/* ⏳ 3. 다가오는 일정(D-Day) 위젯 */}
            <UpcomingEvents events={events} />

            <div className="side-divider" />

            {/* 🏷️ 4. 태그 통계 및 필터링 위젯 */}
            <TagStats events={events} selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
        </div>
    );
}

export default SidePanel;