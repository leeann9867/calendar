import React, { useState } from 'react';
import { isLastInstance } from '../../utils/calendarUtils';

/**
 * [EventDetail]
 * 일정을 클릭했을 때 뜨는 깔끔한 "상세 보기(Read-only)" 전용 컴포넌트입니다.
 * 입력 컨트롤이 없어 모바일에서 키보드가 올라오는 불편함 없이 정보를 빠르게 파악할 수 있습니다.
 */
function EventDetail({ event, selectedDate, onClose, onEdit, onDelete }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // --------------------------------------------------------
    // 삭제 로직: 반복 일정인지 아닌지에 따라 모달 띄우기 유무 결정
    // --------------------------------------------------------
    const onClickDelete = () => {
        if (isLastInstance(event)) {
            if (window.confirm("일정을 삭제하시겠습니까?")) onDelete(event.id, selectedDate, 'all');
        } else {
            // 반복 일정이 여러 개 묶여있는 경우 서브 모달창(이 일정만 삭제할까요? 등) 띄움
            setShowDeleteModal(true);
        }
    };

    const { title, startDate, endDate, color, tag, repeatUnit, repeatValue, reminderUnit, reminderValue, memo, isAllDay } = event;

    const initStart = (event.startTime || '09:00').split(':');
    const startHour = initStart[0];
    const startMinute = initStart[1];
    const initEnd = (event.endTime || '10:00').split(':');
    const endHour = initEnd[0];
    const endMinute = initEnd[1];

    return (
        // 클릭 이벤트가 부모(Overlay)로 올라가서 창이 닫히는 것을 막기 위해 stopPropagation 적용
        <div className="modal-content" onClick={e => e.stopPropagation()}>

            {/* 1. 타이틀 및 시간 영역 (해당 일정 색상으로 좌측 테두리 강조) */}
            <div className="view-mode-header" style={{ borderLeft: `6px solid ${color}` }}>
                <h2>{title}</h2>
                <div className="view-time">
                    {/* 하루 종일 일정이면 시간 생략, 아니면 시:분 표기 */}
                    {startDate} {isAllDay ? '(하루 종일)' : `${startHour}:${startMinute} ~ ${startDate !== endDate ? `${endDate} ` : ''}${endHour}:${endMinute}`}
                </div>
            </div>

            {/* 2. 세부 정보 표시 영역 (데이터가 존재하는 항목만 동적으로 렌더링) */}
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

            {/* 3. 하단 컨트롤 버튼 그룹 */}
            <div className="modal-footer">
                <button className="btn btn-delete" onClick={onClickDelete}>삭제</button>
                <button className="btn btn-cancel" onClick={onClose}>닫기</button>
                <button className="btn btn-save" onClick={onEdit}>수정하기</button>
            </div>

            {/* 4. 반복 일정 삭제 확인용 서브 팝업 */}
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