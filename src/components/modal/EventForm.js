import React, { useState } from 'react';
import { isLastInstance, getFormatDate } from '../../utils/calendarUtils';
import WheelableTimeUnit from '../common/WheelableTimeUnit'; // 🌟 분리한 공통 컴포넌트 임포트

/**
 * [EventForm]
 * 새로운 일정을 생성하거나, 기존 일정을 수정할 때 사용되는 입력 폼(Form) 컴포넌트입니다.
 */
function EventForm({ selectedDate, initData, events, onClose, onSave, onDelete }) {
    const fallbackDate = selectedDate || getFormatDate(new Date()); // 선택된 날짜가 없으면 오늘 날짜로 폴백

    // --------------------------------------------------------
    // 1. 폼 데이터 상태(State) 관리
    // --------------------------------------------------------
    const [title, setTitle] = useState(initData?.title || '');
    const [startDate, setStartDate] = useState(initData?.startDate || fallbackDate);
    const [endDate, setEndDate] = useState(initData?.endDate || fallbackDate);
    const [isAllDay, setIsAllDay] = useState(initData?.isAllDay || false);

    // 시간/분 분리 관리 (조작의 편의성을 위해)
    const initStart = (initData?.startTime || '09:00').split(':');
    const [startHour, setStartHour] = useState(initStart[0]);
    const [startMinute, setStartMinute] = useState(initStart[1]);

    const initEnd = (initData?.endTime || '10:00').split(':');
    const [endHour, setEndHour] = useState(initEnd[0]);
    const [endMinute, setEndMinute] = useState(initEnd[1]);

    // 알림 및 반복 설정 상태
    const [reminderValue, setReminderValue] = useState(initData?.reminderValue || 1);
    const [reminderUnit, setReminderUnit] = useState(initData?.reminderUnit || 'h');
    const [repeatValue, setRepeatValue] = useState(initData?.repeatValue || 1);
    const [repeatUnit, setRepeatUnit] = useState(initData?.repeatUnit || 'none');

    // 태그, 메모, 색상 상태
    const [tag, setTag] = useState(initData?.tag || '');
    const [memo, setMemo] = useState(initData?.memo || '');
    const COLOR_PRESETS = ['#007aff', '#ff3b30', '#34c759', '#ff9500', '#af52de', '#ffcc00', '#8e8e93'];
    const [color, setColor] = useState(initData?.color || COLOR_PRESETS[0]);

    // 서브 모달(반복 일정 수정/삭제 선택창) 렌더링 상태
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // 현재까지 등록된 모든 태그 목록 추출 (자동완성 드롭다운용)
    const existingTags = Array.from(new Set((events || []).filter(ev => ev.tag && ev.tag.trim() !== '').map(ev => ev.tag)));

    // --------------------------------------------------------
    // 2. 입력값 변경 핸들러 함수들
    // --------------------------------------------------------

    /** 시작 날짜를 바꾸면, 종료 날짜가 시작 날짜보다 과거가 되지 않도록 동기화 */
    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        setStartDate(newStart);
        if (newStart > endDate) setEndDate(newStart);
    };

    /** 시작 시간을 바꾸면, 1시간 뒤의 시간을 자동으로 계산해서 종료 시간에 입력해주는 스마트 동기화 함수 */
    const syncEndTime = (newHour, newMin) => {
        const startObj = new Date(`${startDate}T${newHour}:${newMin}:00`);
        startObj.setHours(startObj.getHours() + 1); // 딱 1시간 더함
        const y = startObj.getFullYear();
        const m = String(startObj.getMonth() + 1).padStart(2, '0');
        const d = String(startObj.getDate()).padStart(2, '0');

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

    // --------------------------------------------------------
    // 3. 저장 및 삭제 버튼 로직
    // --------------------------------------------------------

    /** 현재 상태의 입력값들을 하나의 객체(Event Object)로 패킹 */
    const getUpdatedData = () => ({
        id: initData?.id || Date.now().toString(), // 새 일정이면 타임스탬프로 고유 ID 생성
        title, startDate, endDate, isAllDay,
        startTime: isAllDay ? null : `${startHour}:${startMinute}`,
        endTime: isAllDay ? null : `${endHour}:${endMinute}`,
        reminderValue, reminderUnit, repeatValue, repeatUnit, tag, color, memo
    });

    const onClickSave = () => {
        if (!title.trim()) return alert('제목을 입력해주세요.');
        // 반복 일정을 수정하려는데 1개짜리(마지막) 인스턴스가 아니라면 -> 서브 모달 띄워서 묻기
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

    // --------------------------------------------------------
    // 4. 렌더링 (UI)
    // --------------------------------------------------------
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

                {/* 날짜 및 시간 선택 */}
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

                {/* 반복 설정 */}
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

                {/* 태그 입력 및 드롭다운 */}
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

                {/* 메모 작성 */}
                <div className="samsung-row align-top">
                    <span className="icon-area" style={{marginTop: '5px'}}>📝</span>
                    <div className="content-area">
                        <textarea placeholder="일정 메모 추가..." value={memo} onChange={e => setMemo(e.target.value)} className="memo-input" rows="3" />
                    </div>
                </div>

                {/* 색상 선택 팔레트 */}
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