import React from 'react';

function SidePanel({ events, searchTerm, setSearchTerm, selectedTag, setSelectedTag }) {
    // 1. 유효한 태그(공백 제외)가 달린 일정만 추출
    const taggedEvents = events.filter(ev => ev.tag && ev.tag.trim() !== '');
    const totalTaggedCount = taggedEvents.length;

    // 2. 태그별 빈도수 계산
    const tagCounts = taggedEvents.reduce((acc, ev) => {
        acc[ev.tag] = (acc[ev.tag] || 0) + 1;
        return acc;
    }, {});

    // 3. 중복 없는 태그 목록 (정렬: 빈도수 높은 순)
    const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

    // 4. [신규] D-Day 계산 로직
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events
        .filter(ev => new Date(ev.startDate) >= today) // 오늘 포함 미래 일정
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) // 가까운 순 정렬
        .slice(0, 3); // 상위 3개만 노출

    return (
        <div className="side-panel-container">
            <h3 className="side-panel-title">일정 관리</h3>

            {/* 🔍 검색창 영역 */}
            <div className="search-group">
                <input
                    type="text"
                    className="search-input"
                    placeholder="일정 또는 태그 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="stat-group">
                <div className="stat-row">
                    <span>전체 일정</span>
                    <strong>{events.length}건</strong>
                </div>
            </div>

            <div className="side-divider" />

            {/* 🚀 D-Day 위젯 섹션 */}
            <div className="stat-group">
                <div className="side-panel-title" style={{ fontSize: '1.1rem', border: 'none', paddingBottom: '10px' }}>
                    다가오는 일정
                </div>
                <div className="dday-container">
                    {upcomingEvents.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>일정이 없습니다.</p>
                    ) : (
                        upcomingEvents.map(ev => {
                            const evDate = new Date(ev.startDate);
                            evDate.setHours(0, 0, 0, 0);
                            const diff = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                            return (
                                <div key={ev.id} className="dday-item">
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ev.title}</span>
                                    <span className="dday-badge">{diff === 0 ? 'D-Day' : `D-${diff}`}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="side-divider" />

            {/* 📊 태그 통계 시각화 섹션 (복구 완료!) */}
            <div className="stat-group">
                <div className="side-panel-title" style={{ fontSize: '1.1rem', border: 'none', paddingBottom: '10px' }}>
                    태그별 비중
                </div>
                <div className="tag-stat-container">
                    {totalTaggedCount === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>등록된 태그가 없습니다.</p>
                    ) : (
                        sortedTags.slice(0, 5).map(tag => {
                            const count = tagCounts[tag];
                            const percentage = Math.round((count / totalTaggedCount) * 100);
                            return (
                                <div key={tag} className="tag-stat-item">
                                    <div className="tag-stat-info">
                                        <span>{tag}</span>
                                        <span className="percentage">{percentage}%</span>
                                    </div>
                                    <div className="stat-bar-bg">
                                        <div className="stat-bar-fill" style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="side-divider" />

            {/* 🏷️ 내 태그 목록 및 필터링 버튼 (복구 완료!) */}
            <div className="stat-group">
                <div className="side-panel-title" style={{ fontSize: '1.1rem', border: 'none', paddingBottom: '5px' }}>
                    태그 필터링
                </div>
                <div className="tag-list">
          <span
              className={`tag-item ${selectedTag === null ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
              style={{ cursor: 'pointer' }}
          >
            #전체보기
          </span>
                    {sortedTags.map((tag, idx) => (
                        <span
                            key={idx}
                            className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
                            onClick={() => setSelectedTag(tag)}
                            style={{ cursor: 'pointer' }}
                        >
              #{tag}
            </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SidePanel;