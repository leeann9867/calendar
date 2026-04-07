import React, { useState } from 'react';
import { isLastInstance, getFormatDate } from '../../utils/calendarUtils';
import WheelableTimeUnit from '../common/WheelableTimeUnit';

/**
 * [EventForm Component]
 * 신규 일정을 생성하거나 기존 일정을 수정(Edit)하기 위한 폼 UI 컴포넌트입니다.
 * 날짜/시간 선택, 반복/알림 설정, 태그 추가, 메모 작성 및 색상 지정 등 모든 입력 로직을 통합 관리합니다.
 * @param {string} selectedDate - 달력에서 클릭하여 선택된 기본 날짜 (YYYY-MM-DD)
 * @param {Object|null} initData - 수정 모드일 경우 전달되는 기존 일정 데이터 (생성 모드면 null)
 * @param {Array} events - 기존에 등록된 전체 일정 배열 (태그 자동완성을 위해 사용)
 * @param {function} onClose - 모달 닫기 함수
 * @param {function} onSave - 변경된 일정 데이터를 부모로 전달하여 저장하는 함수
 * @param {function} onDelete - 일정을 삭제하는 함수
 */
function EventForm({ selectedDate, initData, events, onClose, onSave, onDelete }) {
    const fallbackDate = selectedDate || getFormatDate(new Date());

    // ==========================================
    // [상태(State) 관리] 폼 입력 필드들의 상태값 모음
    // ==========================================
    const [title, setTitle] = useState(initData?.title || '');
    const [startDate, setStartDate] = useState(initData?.startDate || fallbackDate);
    const [endDate, setEndDate] = useState(initData?.endDate || fallbackDate);
    const [isAllDay, setIsAllDay] = useState(initData?.isAllDay || false); // 하루 종일 여부

    // 시/분 단위 제어를 위해 각각 분리하여 상태 저장
    const initStart = (initData?.startTime || '09:00').split(':');
    const [startHour, setStartHour] = useState(initStart[0]);
    const [startMinute, setStartMinute] = useState(initStart[1]);

    const initEnd = (initData?.endTime || '10:00').split(':');
    const [endHour, setEndHour] = useState(initEnd[0]);
    const [endMinute, setEndMinute] = useState(initEnd[1]);

    const [reminderValue, setReminderValue] = useState(initData?.reminderValue || 1);
    const [reminderUnit, setReminderUnit] = useState(initData?.reminderUnit || 'h');
    const [repeatValue, setRepeatValue] = useState(initData?.repeatValue || 1);
    const [repeatUnit, setRepeatUnit] = useState(initData?.repeatUnit || 'none');
    const [tag, setTag] = useState(initData?.tag || '');
    const [memo, setMemo] = useState(initData?.memo || '');

    const COLOR_PRESETS = ['#007aff', '#ff3b30', '#34c759', '#ff9500', '#af52de', '#ffcc00', '#8e8e93'];
    const [color, setColor] = useState(initData?.color || COLOR_PRESETS[0]);

    // 다중 반복 일정 수정/삭제 시 팝업될 서브 모달 상태
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // 태그 자동완성 드롭박스 생성을 위해 전체 이벤트에서 중복 없는 태그 리스트 추출
    const existingTags = Array.from(new Set((events || []).filter(ev => ev.tag && ev.tag.trim() !== '').map(ev => ev.tag)));

    // ==========================================
    // [제어 로직] 날짜 및 시간 동기화 스마트 알고리즘
    // ==========================================

    // 시작 날짜 변경 시, 종료 날짜가 시작 날짜보다 과거로 설정되지 않도록 자동 방어
    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        setStartDate(newStart);
        if (newStart > endDate) setEndDate(newStart);
    };

    // 시작 시간(시/분)이 변경되면 자동으로 '1시간 뒤'를 계산하여 종료 시간(End Time)에 세팅
    const syncEndTime = (newHour, newMin) => {
        const startObj = new Date(`${startDate}T${newHour}:${newMin}:00`);
        startObj.setHours(startObj.getHours() + 1); // 1시간을 더함

        const y = startObj.getFullYear();
        const m = String(startObj.getMonth() + 1).padStart(2, '0');
        const d = String(startObj.getDate()).padStart(2, '0');

        // 날짜가 자정을 넘겨 다음 날이 되었다면 종료 날짜도 함께 갱신
        setEndDate(`${y}-${m}-${d}`);
        setEndHour(String(startObj.getHours()).padStart(2, '0'));
        setEndMinute(String(startObj.getMinutes()).padStart(2, '0'));
    };

    const handleStartHourChange = (newVal) => {
        setStartHour(newVal);
        syncEndTime(newVal, startMinute);
    };

    const handleStartMinuteChange = (newVal) => {
        setStartMinute(newVal);
        syncEndTime(startHour, newVal);
    };

    // ==========================================
    // [데이터 전송 로직] 생성 및 수정 패킹
    // ==========================================
    const getUpdatedData = () => ({
        id: initData?.id || Date.now().toString(), // 고유 ID 부여
        title, startDate, endDate, isAllDay,
        startTime: isAllDay ? null : `${startHour}:${startMinute}`, // 하루 종일이면 시간 무시
        endTime: isAllDay ? null : `${endHour}:${endMinute}`,
        reminderValue, reminderUnit, repeatValue, repeatUnit, tag, color, memo
    });

    const onClickSave = () => {
        if (!title.trim()) return alert('제목을 입력해주세요.');
        // 반복 설정이 되어 있는 일정 묶음 중 남은 일정이 여러 개일 경우 서브 모달창 분기 처리
        if (initData && initData.repeatUnit && initData.repeatUnit !== 'none' && !isLastInstance(initData)) {
            setShowSaveModal(true);
        } else {
            onSave(getUpdatedData(), 'all');
        }
    };

    const onClickDelete = () => {
        if (!initData) return;
        if (isLastInstance(initData)) {
            if (window.confirm("일정을 삭제하시겠습니까?")) onDelete(initData.id, selectedDate, 'all');
        } else {
            setShowDeleteModal(true);
        }
    };

    return (
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-samsung">
                <input placeholder="제목 추가" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>
            <div className="samsung-body">

                {/* 하루 종일 토글 */}
                <div className="samsung-row">
                    <span className="icon-area">⏰</span>
                    <div className="content-area" style={{ justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>하루 종일</span>
                        <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                    </div>
                </div>

                {/* 날짜 및 커스텀 시간 휠 */}
                <div className="samsung-row">
                    <span className="icon-area">🕒</span>
                    <div className="content-area custom-time-area">
                        <div className="time-block">
                            <input type="date" value={startDate} onChange={handleStartDateChange} className="date-input" />
                            {!isAllDay && (
                                <div className="custom-time-picker">
                                    {/* 외부에 분리해 둔 드래그/휠 컴포넌트 재사용 */}
                                    <WheelableTimeUnit value={startHour} max={23} onChange={handleStartHourChange} />
                                    <span style={{ fontWeight: '800', margin: '0 2px' }}>:</span>
                                    <WheelableTimeUnit value={startMinute} max={59} onChange={handleStartMinuteChange} />
                                </div>
                            )}
                        </div>
                        <div className="time-divider">~</div>
                        <div className="time-block">
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="date-input" />
                            {!isAllDay && (
                                <div className="custom-time-picker">
                                    <WheelableTimeUnit value={endHour} max={23} onChange={setEndHour} />
                                    <span style={{ fontWeight: '800', margin: '0 2px' }}>:</span>
                                    <WheelableTimeUnit value={endMinute} max={59} onChange={setEndMinute} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 반복 주기 설정 */}
                <div className="samsung-row">
                    <span className="icon-area">🔁</span>
                    <div className="content-area custom-reminder-area">
                        <input type="number" value={repeatValue} disabled={repeatUnit === 'none'} onChange={e => setRepeatValue(Math.max(1, e.target.value))} className="reminder-num" style={{ opacity: repeatUnit === 'none' ? 0.3 : 1 }} />
                        <select value={repeatUnit} onChange={e => setRepeatUnit(e.target.value)} className="reminder-select">
                            <option value="none">반복 안 함</option><option value="day">일 마다</option><option value="week">주 마다</option><option value="month">개월 마다</option><option value="year">년 마다</option>
                        </select>
                    </div>
                </div>

                {/* 알림 설정 */}
                <div className="samsung-row">
                    <span className="icon-area">🔔</span>
                    <div className="content-area custom-reminder-area">
                        <input type="number" value={reminderValue} onChange={e => setReminderValue(Math.max(0, e.target.value))} className="reminder-num" />
                        <select value={reminderUnit} onChange={e => setReminderUnit(e.target.value)} className="reminder-select">
                            <option value="m">분 전</option><option value="h">시간 전</option><option value="d">일 전</option>
                        </select>
                    </div>
                </div>

                {/* 태그 작성 영역 */}
                <div className="samsung-row">
                    <span className="icon-area">🏷️</span>
                    <div className="content-area" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="text" placeholder="태그 추가 (공백 가능)" value={tag} onChange={e => setTag(e.target.value)} style={{ flex: 1, background: 'transparent', color: 'var(--text-main)', fontSize: '1.05rem', border: 'none', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', outline: 'none' }} />
                        {existingTags.length > 0 && (
                            <select className="reminder-select" value={existingTags.includes(tag) ? tag : ""} onChange={e => setTag(e.target.value)} style={{ padding: '6px', fontSize: '0.9rem', maxWidth: '130px' }}>
                                <option value="" disabled>기존 태그...</option>
                                {existingTags.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* 메모 작성 영역 */}
                <div className="samsung-row align-top">
                    <span className="icon-area" style={{marginTop: '5px'}}>📝</span>
                    <div className="content-area">
                        <textarea placeholder="일정 메모 추가..." value={memo} onChange={e => setMemo(e.target.value)} className="memo-input" rows="3" />
                    </div>
                </div>

                {/* 색상 선택 팔레트 영역 */}
                <div className="samsung-row">
                    <span className="icon-area">🎨</span>
                    <div className="content-area color-picker-area">
                        {COLOR_PRESETS.map(presetColor => (
                            <div key={presetColor} className={`color-preset-circle ${color === presetColor ? 'active' : ''}`} style={{ backgroundColor: presetColor }} onClick={() => setColor(presetColor)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* 하단 제어 버튼 */}
            <div className="modal-footer">
                {initData && <button className="btn btn-delete" onClick={onClickDelete}>삭제</button>}
                <button className="btn btn-cancel" onClick={onClose}>취소</button>
                <button className="btn btn-save" onClick={onClickSave}>저장</button>
            </div>

            {/* 반복 일정 전용 서브 모달 (수정/삭제 범위 선택창) */}
            {showDeleteModal && (
                <div className="sub-modal-overlay">
                    <div className="sub-modal-content">
                        <h4>반복 일정 삭제</h4>
                        <div className="sub-modal-buttons">
                            <button className="sub-btn" onClick={() => onDelete(initData.id, selectedDate, 'single')}>이 일정만 삭제</button>
                            <button className="sub-btn" onClick={() => onDelete(initData.id, selectedDate, 'future')}>이 이후 일정 삭제</button>
                            <button className="sub-btn delete-all" onClick={() => onDelete(initData.id, selectedDate, 'all')}>연관된 모든 일정 삭제</button>
                        </div>
                        <button className="sub-btn-cancel" onClick={() => setShowDeleteModal(false)}>취소</button>
                    </div>
                </div>
            )}
            {showSaveModal && (
                <div className="sub-modal-overlay">
                    <div className="sub-modal-content">
                        <h4>반복 일정 수정</h4>
                        <p>반복되는 일정입니다. 어떻게 수정하시겠습니까?</p>
                        <div className="sub-modal-buttons">
                            <button className="sub-btn" onClick={() => onSave(getUpdatedData(), 'single', selectedDate)}>이 일정만 수정</button>
                            <button className="sub-btn" onClick={() => onSave(getUpdatedData(), 'all')}>연관된 모든 일정 수정</button>
                        </div>
                        <button className="sub-btn-cancel" onClick={() => setShowSaveModal(false)}>취소</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventForm;