import React from 'react';

function SidePanel({ events, searchTerm, setSearchTerm, selectedTag, setSelectedTag }) {
    const taggedEvents = events.filter(ev => ev.tag && ev.tag.trim() !== '');
    const totalTaggedCount = taggedEvents.length;

    const tagCounts = taggedEvents.reduce((acc, ev) => {
        acc[ev.tag] = (acc[ev.tag] || 0) + 1;
        return acc;
    }, {});

    const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🌟 D-Day 일정을 최대 5개까지 보여줍니다.
    const upcomingEvents = events
        .filter(ev => new Date(ev.startDate).getTime() >= today.getTime())
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5);

    return (
        <div className="side-panel-container">
            <h3 className="side-panel-title">일정 관리</h3>

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

            {/* 🌟 데스크톱 D-Day 상세 표시 (메모 포함) */}
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
                                <div key={ev.id} className="dday-item-wrapper" style={{ borderLeftColor: ev.color || 'var(--sat-blue)' }}>
                                    <div className="dday-item-header">
                                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ev.title}</span>
                                        <span className="dday-badge" style={{ backgroundColor: ev.color || 'var(--sat-blue)' }}>
                      {diff === 0 ? 'D-Day' : `D-${diff}`}
                    </span>
                                    </div>
                                    <div className="dday-item-time">
                                        {ev.startDate} ({ev.startTime || '00:00'} ~ {ev.endTime || '23:59'})
                                    </div>
                                    {/* 일정에 메모가 있다면 보여줌 */}
                                    {ev.memo && <div className="dday-item-memo">{ev.memo}</div>}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="side-divider" />

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

            <div className="stat-group">
                <div className="side-panel-title" style={{ fontSize: '1.1rem', border: 'none', paddingBottom: '5px' }}>
                    태그 필터링
                </div>
                <div className="tag-list">
          <span className={`tag-item ${selectedTag === null ? 'active' : ''}`} onClick={() => setSelectedTag(null)} style={{ cursor: 'pointer' }}>
            #전체보기
          </span>
                    {sortedTags.map((tag, idx) => (
                        <span key={idx} className={`tag-item ${selectedTag === tag ? 'active' : ''}`} onClick={() => setSelectedTag(tag)} style={{ cursor: 'pointer' }}>
              #{tag}
            </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SidePanel;