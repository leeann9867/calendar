import React from 'react';

const formatAlarmText = (mins) => {
    if (mins === 0) return '정각';
    if (mins % 1440 === 0) return `${mins / 1440}일 전`;
    if (mins % 60 === 0) return `${mins / 60}시간 전`;
    return `${mins}분 전`;
};

function EventDetail({ event, onDelete, onEdit, onClose, openConfirm }) {
    if (!event) return null;

    // 🌟 [버그 픽스] 조회 화면에서도 빈 값은 확실히 빈 배열로!
    const parsedAlarms = (() => {
        const raw = event?.alarms ?? event?.alarm;
        if (raw === '' || raw === null || raw === undefined) return [];
        if (Array.isArray(raw)) return raw.map(Number);
        if (typeof raw === 'number') return [raw];
        if (typeof raw === 'string') {
            try {
                const p = JSON.parse(raw);
                if(Array.isArray(p)) return p.map(Number);
                return raw.split(',').map(Number).filter(n => !isNaN(n));
            } catch {
                return raw.split(',').map(Number).filter(n => !isNaN(n));
            }
        }
        return [];
    })();

    const parsedIsAlarmOn = event?.isAlarmOn !== undefined
        ? (event.isAlarmOn === true || event.isAlarmOn === 1 || event.isAlarmOn === 'true')
        : true;

    const handleDelete = () => {
        if (event.repeatUnit && event.repeatUnit !== 'none') {
            openConfirm("반복 일정 삭제", "삭제할 범위를 선택해주세요.", [
                { label: "이 일정만 삭제", action: () => onDelete(event.id, event.startDate, 'single'), className: "sub-btn delete-all" },
                { label: "이 시점 이후 모두 삭제", action: () => onDelete(event.id, event.startDate, 'following'), className: "sub-btn delete-all" },
                { label: "전체 삭제", action: () => onDelete(event.id, null, 'all'), className: "sub-btn delete-all" }
            ]);
        } else {
            openConfirm("일정 삭제", "정말 이 일정을 삭제하시겠습니까?", [
                { label: "삭제하기", action: () => onDelete(event.id, null, 'all'), className: "sub-btn delete-all" }
            ]);
        }
    };

    const unitMap = { daily: '일', weekly: '주', monthly: '개월' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className="view-mode-header">
                <h2>{event.title}</h2>
                <div className="view-time">📅 {event.startDate} {event.isAllDay ? '(하루 종일)' : `${event.startTime} ~ ${event.endTime}`}</div>
            </div>

            <div className="view-mode-body">
                <div className="view-row align-top" style={{ alignItems: 'flex-start' }}>
                    <div className="icon" style={{ marginTop: '2px' }}>🔔</div>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {parsedIsAlarmOn && parsedAlarms.length > 0 ? (
                            parsedAlarms.sort((a,b)=>a-b).map(a => (
                                <span key={a} className="tag-badge" style={{ backgroundColor: 'var(--sat-blue)' }}>{formatAlarmText(a)}</span>
                            ))
                        ) : (
                            <span style={{ color: 'var(--text-muted)' }}>알림 꺼짐</span>
                        )}
                    </div>
                </div>

                {event.repeatUnit !== 'none' && (
                    <div className="view-row"><div className="icon">🔁</div><span>반복: {event.repeatValue}{unitMap[event.repeatUnit]}마다 (종료: {event.repeatEndDate || '없음'})</span></div>
                )}
                <div className="view-row"><div className="icon">🎨</div><div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: event.color, boxShadow: '0 2px 4px var(--shadow)' }} /></div>
                {event.tag && (
                    <div className="view-row"><div className="icon">🏷️</div><span className="tag-badge" style={{ backgroundColor: 'var(--text-muted)' }}>{event.tag}</span></div>
                )}
                {event.memo && (
                    <div className="view-row align-top" style={{ alignItems: 'flex-start' }}><div className="icon" style={{ marginTop: '2px' }}>📝</div><div className="view-memo-box">{event.memo}</div></div>
                )}
            </div>

            <div className="modal-footer">
                <button onClick={handleDelete} className="btn btn-delete">삭제</button>
                <button onClick={onClose} className="btn btn-cancel">닫기</button>
                <button onClick={onEdit} className="btn btn-save">수정</button>
            </div>
        </div>
    );
}

export default EventDetail;