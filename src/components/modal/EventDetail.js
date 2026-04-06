import React, { useState } from 'react';
import { isLastInstance } from '../../utils/calendarUtils';

function EventDetail({ event, selectedDate, onClose, onEdit, onDelete }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const onClickDelete = () => {
        if (isLastInstance(event)) {
            if (window.confirm("일정을 삭제하시겠습니까?")) onDelete(event.id, selectedDate, 'all');
        } else {
            setShowDeleteModal(true);
        }
    };

    const { title, startDate, endDate, color, tag, repeatUnit, repeatValue, reminderUnit, reminderValue, memo } = event;
    const initStart = (event.startTime || '09:00').split(':');
    const startHour = initStart[0];
    const startMinute = initStart[1];
    const initEnd = (event.endTime || '10:00').split(':');
    const endHour = initEnd[0];
    const endMinute = initEnd[1];

    return (
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="view-mode-header" style={{ borderLeft: `6px solid ${color}` }}>
                <h2>{title}</h2>
                <div className="view-time">
                    {startDate} {startHour}:{startMinute} ~ {startDate !== endDate ? `${endDate} ` : ''}{endHour}:{endMinute}
                </div>
            </div>

            <div className="view-mode-body">
                {tag && <div className="view-row"><span className="icon">🏷️</span> <span className="tag-badge">{tag}</span></div>}
                {repeatUnit !== 'none' && <div className="view-row"><span className="icon">🔁</span> <span>{repeatValue}{repeatUnit === 'day' ? '일' : repeatUnit === 'week' ? '주' : repeatUnit === 'month' ? '개월' : '년'}마다 반복</span></div>}
                {(reminderValue > 0 || reminderUnit !== 'h') && <div className="view-row"><span className="icon">🔔</span> <span>{reminderValue}{reminderUnit === 'm' ? '분' : reminderUnit === 'h' ? '시간' : '일'} 전 알림</span></div>}
                {memo && (
                    <div className="view-row align-top">
                        <span className="icon">📝</span>
                        <div className="view-memo-box">{memo}</div>
                    </div>
                )}
            </div>

            <div className="modal-footer">
                <button className="btn btn-delete" onClick={onClickDelete}>삭제</button>
                <button className="btn btn-cancel" onClick={onClose}>닫기</button>
                <button className="btn btn-save" onClick={onEdit}>수정하기</button>
            </div>

            {showDeleteModal && (
                <div className="sub-modal-overlay">
                    <div className="sub-modal-content">
                        <h4>반복 일정 삭제</h4>
                        <div className="sub-modal-buttons">
                            <button className="sub-btn" onClick={() => onDelete(event.id, selectedDate, 'single')}>이 일정만 삭제</button>
                            <button className="sub-btn" onClick={() => onDelete(event.id, selectedDate, 'future')}>이 이후 일정 삭제</button>
                            <button className="sub-btn delete-all" onClick={() => onDelete(event.id, selectedDate, 'all')}>연관된 모든 일정 삭제</button>
                        </div>
                        <button className="sub-btn-cancel" onClick={() => setShowDeleteModal(false)}>취소</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventDetail;