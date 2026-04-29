import React from 'react';

/**
 * [TagStats Widget]
 * 사용자가 등록한 태그들을 모아서 수집한 뒤,
 * 가장 많이 사용된 태그 순으로 정렬하고 퍼센트(%) 바 그래프로 보여줍니다.
 * 또한 태그를 클릭하여 달력을 필터링할 수 있는 버튼을 제공합니다.
 */
function TagStats({ events, selectedTag, setSelectedTag }) {
    // 태그 필드가 공백이 아닌 일정만 추출
    const taggedEvents = events.filter(ev => ev.tag && ev.tag.trim() !== '');
    const totalTaggedCount = taggedEvents.length;

    // Reduce 함수를 이용해 { "운동": 5, "업무": 3 ... } 형태로 각 태그의 출현 빈도수 카운트
    const tagCounts = taggedEvents.reduce((acc, ev) => {
        acc[ev.tag] = (acc[ev.tag] || 0) + 1;
        return acc;
    }, {});

    // 빈도수(Value)가 높은 순서대로 태그 이름(Key)을 정렬하여 배열로 만듦
    const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

    return (
        <>
            {/* ================= 태그별 비중 (바 그래프) ================= */}
            <div className="stat-group">
                <div className="side-panel-title" style={{ fontSize: '1.1rem', border: 'none', paddingBottom: '10px' }}>
                    태그별 비중
                </div>
                <div className="tag-stat-container">
                    {totalTaggedCount === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>등록된 태그가 없습니다.</p>
                    ) : (
                        // 상위 5개 태그만 그래프로 렌더링
                        sortedTags.slice(0, 5).map(tag => {
                            const count = tagCounts[tag];
                            const percentage = Math.round((count / totalTaggedCount) * 100);
                            return (
                                <div key={tag} className="tag-stat-item">
                                    <div className="tag-stat-info">
                                        <span>{tag}</span>
                                        <span className="percentage">{percentage}%</span>
                                    </div>
                                    {/* % 수치에 비례해서 파란색 바(Fill)의 너비가 동적으로 변함 */}
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

            {/* ================= 태그 필터링 (버튼 칩) ================= */}
            <div className="stat-group">
                <div className="side-panel-title" style={{ fontSize: '1.1rem', border: 'none', paddingBottom: '5px' }}>
                    태그 필터링
                </div>
                <div className="tag-list">
                    {/* 전체보기 버튼: 클릭 시 전역 상태를 null로 만들어 필터링 해제 */}
                    <span className={`tag-item ${selectedTag === null ? 'active' : ''}`} onClick={() => setSelectedTag(null)} style={{ cursor: 'pointer' }}>
            #전체보기
          </span>

                    {/* 개별 태그 버튼들 */}
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