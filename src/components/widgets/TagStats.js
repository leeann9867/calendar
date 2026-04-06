import React from 'react';

function TagStats({ events, selectedTag, setSelectedTag }) {
    const taggedEvents = events.filter(ev => ev.tag && ev.tag.trim() !== '');
    const totalTaggedCount = taggedEvents.length;

    const tagCounts = taggedEvents.reduce((acc, ev) => {
        acc[ev.tag] = (acc[ev.tag] || 0) + 1;
        return acc;
    }, {});

    const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

    return (
        <>
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
        </>
    );
}

export default TagStats;