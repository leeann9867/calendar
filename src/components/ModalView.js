import React, { useState, useEffect } from 'react'; // 🌟 useEffect 추가

function ModalView({ selectedDate, initData, events, onClose, onSave, onDelete }) {
    const [title, setTitle] = useState(initData?.title || '');
    const [startDate, setStartDate] = useState(initData?.startDate || selectedDate);
    const [endDate, setEndDate] = useState(initData?.endDate || selectedDate);

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

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // 🌟 [핵심] 모달이 열려있는 동안 배경(달력) 스크롤 완벽 차단
    useEffect(() => {
        document.body.style.overflow = 'hidden'; // 배경 스크롤 잠금
        return () => {
            document.body.style.overflow = ''; // 모달이 닫힐 때 스크롤 원상복구
        };
    }, []);

    const existingTags = Array.from(new Set((events || []).filter(ev => ev.tag && ev.tag.trim() !== '').map(ev => ev.tag)));

    const isLastInstance = () => {
        if (!initData || !initData.repeatUnit || initData.repeatUnit === 'none') return true;
        const s = new Date(initData.originalStartDate || initData.startDate);
        const exclusions = initData.excludedDates || [];
        const repeatEnd = initData.repeatEndDate ? new Date(initData.repeatEndDate).getTime() : new Date('2099-12-31').getTime();
        const interval = parseInt(initData.repeatValue, 10) || 1;

        let count = 0;
        let current = new Date(s);
        let loopLimit = 0;

        while (current.getTime() <= repeatEnd && count < 2 && loopLimit < 1000) {
            loopLimit++;
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            if (!exclusions.includes(dateStr)) count++;

            if (initData.repeatUnit === 'day') current.setDate(current.getDate() + interval);
            else if (initData.repeatUnit === 'week') current.setDate(current.getDate() + interval * 7);
            else if (initData.repeatUnit === 'month') current.setMonth(current.getMonth() + interval);
            else if (initData.repeatUnit === 'year') current.setFullYear(current.getFullYear() + interval);
            else break;
        }
        return count <= 1;
    };

    const syncEndTime = (newDate, newHour, newMin) => {
        const startObj = new Date(`${newDate}T${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}:00`);
        startObj.setHours(startObj.getHours() + 1);
        const y = startObj.getFullYear();
        const m = String(startObj.getMonth() + 1).padStart(2, '0');
        const d = String(startObj.getDate()).padStart(2, '0');
        setEndDate(`${y}-${m}-${d}`);
        setEndHour(String(startObj.getHours()).padStart(2, '0'));
        setEndMinute(String(startObj.getMinutes()).padStart(2, '0'));
    };

    const handleTimeSpin = (setter, val, max, type) => {
        let num = parseInt(val, 10);
        if (isNaN(num)) num = 0;
        if (num < 0) num = max;
        if (num > max) num = 0;
        const formatted = String(num).padStart(2, '0');
        setter(formatted);
        if (type === 'startH') syncEndTime(startDate, formatted, startMinute);
        if (type === 'startM') syncEndTime(startDate, startHour, formatted);
    };

    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        setStartDate(newStart);
        if (newStart > endDate) {
            setEndDate(newStart);
        }
    };

    const getUpdatedData = () => ({
        id: initData?.id || Date.now().toString(),
        title, startDate, endDate,
        startTime: `${startHour}:${startMinute}`,
        endTime: `${endHour}:${endMinute}`,
        reminderValue, reminderUnit, repeatValue, repeatUnit, tag, color, textColor: '#ffffff',
        memo
    });

    const onClickSave = () => {
        if (!title.trim()) return alert('제목을 입력해주세요.');
        if (initData && initData.repeatUnit && initData.repeatUnit !== 'none' && !isLastInstance()) {
            setShowSaveModal(true);
        } else {
            onSave(getUpdatedData(), 'all');
        }
    };

    const onClickDelete = () => {
        if (!initData) return;
        if (isLastInstance()) {
            if (window.confirm("일정을 삭제하시겠습니까?")) onDelete(initData.id, selectedDate, 'all');
        } else {
            setShowDeleteModal(true);
        }
    };

    return (
        // 🌟 휠 스크롤 전파 방지를 위해 onWheel 이벤트 차단 추가
        <div className="modal-overlay" onClick={onClose} onWheel={e => e.stopPropagation()}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header-samsung">
                    <input placeholder="제목 추가" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
                </div>
                <div className="samsung-body">
                    <div className="samsung-row time-setting-row">
                        <span className="icon-area">🕒</span>
                        <div className="content-area custom-time-area">
                            <div className="time-block">
                                <input type="date" value={startDate} onChange={handleStartDateChange} className="date-input" />
                                <div className="custom-time-picker">
                                    <input type="number" value={startHour} onChange={e => handleTimeSpin(setStartHour, e.target.value, 23, 'startH')} className="time-num" />
                                    <span>:</span>
                                    <input type="number" value={startMinute} onChange={e => handleTimeSpin(setStartMinute, e.target.value, 59, 'startM')} className="time-num" />
                                </div>
                            </div>
                            <div className="time-divider">~</div>
                            <div className="time-block">
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="date-input" />
                                <div className="custom-time-picker">
                                    <input type="number" value={endHour} onChange={e => handleTimeSpin(setEndHour, e.target.value, 23, 'endH')} className="time-num" />
                                    <span>:</span>
                                    <input type="number" value={endMinute} onChange={e => handleTimeSpin(setEndMinute, e.target.value, 59, 'endM')} className="time-num" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="samsung-row">
                        <span className="icon-area">🔁</span>
                        <div className="content-area custom-reminder-area">
                            <input type="number" value={repeatValue} disabled={repeatUnit === 'none'} onChange={e => setRepeatValue(Math.max(1, e.target.value))} className="reminder-num" style={{ opacity: repeatUnit === 'none' ? 0.3 : 1 }} />
                            <select value={repeatUnit} onChange={e => setRepeatUnit(e.target.value)} className="reminder-select">
                                <option value="none">반복 안 함</option><option value="day">일 마다</option><option value="week">주 마다</option><option value="month">개월 마다</option><option value="year">년 마다</option>
                            </select>
                        </div>
                    </div>
                    <div className="samsung-row">
                        <span className="icon-area">🔔</span>
                        <div className="content-area custom-reminder-area">
                            <input type="number" value={reminderValue} onChange={e => setReminderValue(Math.max(0, e.target.value))} className="reminder-num" />
                            <select value={reminderUnit} onChange={e => setReminderUnit(e.target.value)} className="reminder-select">
                                <option value="m">분 전</option><option value="h">시간 전</option><option value="d">일 전</option>
                            </select>
                        </div>
                    </div>
                    <div className="samsung-row">
                        <span className="icon-area">🏷️</span>
                        <div className="content-area">
                            <input list="tag-list-options" type="text" placeholder="태그 추가 (공백 가능)" value={tag} onChange={e => setTag(e.target.value)} style={{ width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }} />
                            <datalist id="tag-list-options">
                                {existingTags.map(t => <option key={t} value={t} />)}
                            </datalist>
                        </div>
                    </div>
                    <div className="samsung-row align-top">
                        <span className="icon-area" style={{marginTop: '5px'}}>📝</span>
                        <div className="content-area">
                            <textarea placeholder="일정 메모 추가..." value={memo} onChange={e => setMemo(e.target.value)} className="memo-input" rows="3" />
                        </div>
                    </div>
                    <div className="samsung-row">
                        <span className="icon-area">🎨</span>
                        <div className="content-area color-picker-area">
                            {COLOR_PRESETS.map(presetColor => (
                                <div key={presetColor} className={`color-preset-circle ${color === presetColor ? 'active' : ''}`} style={{ backgroundColor: presetColor }} onClick={() => setColor(presetColor)} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    {initData && <button className="btn btn-delete" onClick={onClickDelete}>삭제</button>}
                    <button className="btn btn-cancel" onClick={onClose}>취소</button>
                    <button className="btn btn-save" onClick={onClickSave}>저장</button>
                </div>

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
        </div>
    );
}

export default ModalView;