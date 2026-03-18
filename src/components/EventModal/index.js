import React, { useState, useMemo } from 'react';
import ColorPicker from './ColorPicker';
import RepeatSettings from './RepeatSettings';
import NotificationSettings from './NotificationSettings';
import { formatDate } from '../../utils/helpers';

/**
 * 일정 상세 설정 모달
 * 24시간제 시/분 분리 선택형 UI를 통해 브라우저 기본 타임피커 이슈 해결
 */
export default function EventModal({ initData, onSave, onDelete, onClose }) {
    const [form, setForm] = useState({
        ...initData,
        title: initData.title || '',
        color: initData.color || 'blue',
        repeat: initData.repeat || 'none',
        time: initData.time || "09:00",
        endTime: initData.endTime || "10:00"
    });
    const [showDeleteOptions, setShowDeleteOptions] = useState(false);

    // 00-23시, 00-59분 옵션 생성 (연결성 보존을 위해 1분 단위 유지)
    const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
    const minOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

    /**
     * 시/분 변경 통합 핸들러
     * 시작 시간 변경 시 사용 편의성을 위해 종료 시간을 1시간 뒤로 자동 연동함
     */
    const handleTimeChange = (type, field, value) => {
        const [h, m] = form[field].split(':');
        const newTimeValue = type === 'h' ? `${value}:${m}` : `${h}:${value}`;

        setForm(prev => {
            const nextState = { ...prev, [field]: newTimeValue };

            // 시작 시간(time) 변경 시에만 종료 시간(endTime) 1시간 뒤로 연동
            if (field === 'time') {
                const [nh, nm] = newTimeValue.split(':').map(Number);
                const autoEndH = String((nh + 1) % 24).padStart(2, '0');
                nextState.endTime = `${autoEndH}:${String(nm).padStart(2, '0')}`;
            }
            return nextState;
        });
    };

    /**
     * 저장 전처리 로직
     * 밤샘 일정(종료시간 < 시작시간) 발생 시 종료일(endDate)을 자동으로 다음 날로 설정
     */
    const handleSave = () => {
        let finalEndDate = form.endDate || form.date;

        // 시간 비교를 통한 익일 종료 판별
        if (form.endTime <= form.time) {
            const nextDay = new Date(form.date);
            nextDay.setDate(nextDay.getDate() + 1);
            finalEndDate = formatDate(nextDay);
        } else {
            // 기간 설정이 별도로 없는 일반 일정은 종료일을 시작일과 동일하게 유지
            if (!form.endDate || form.endDate === form.date) finalEndDate = form.date;
        }

        onSave({
            ...form,
            endDate: finalEndDate,
            title: form.title.trim() || '(제목 없음)'
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-section title-section">
                    <input
                        className="input-title-main"
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                        placeholder="일정 제목"
                        autoFocus
                    />

                    {/* 24시간제 시/분 선택 영역 (글자 생략 및 콜론 구분) */}
                    <div className="time-split-picker">
                        <div className="time-block">
                            <span className="label">시작</span>
                            <div className="select-row">
                                <select value={form.time.split(':')[0]} onChange={e => handleTimeChange('h', 'time', e.target.value)}>
                                    {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span className="time-colon">:</span>
                                <select value={form.time.split(':')[1]} onChange={e => handleTimeChange('m', 'time', e.target.value)}>
                                    {minOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <span className="time-separator">~</span>
                        <div className="time-block">
                            <span className="label">종료</span>
                            <div className="select-row">
                                <select value={form.endTime.split(':')[0]} onChange={e => handleTimeChange('h', 'endTime', e.target.value)}>
                                    {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span className="time-colon">:</span>
                                <select value={form.endTime.split(':')[1]} onChange={e => handleTimeChange('m', 'endTime', e.target.value)}>
                                    {minOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-section">
                    <ColorPicker selectedColor={form.color} onChange={c => setForm({...form, color: c})} />
                </div>

                <RepeatSettings form={form} onChange={(k, v) => setForm({...form, [k]: v})} />
                <NotificationSettings form={form} onChange={(k, v) => setForm({...form, [k]: v})} />

                <div className="modal-actions">
                    {initData.id && (
                        <div className="delete-wrapper">
                            <button className="btn-delete-trigger" onClick={() => (form.repeat !== 'none' ? setShowDeleteOptions(!showDeleteOptions) : onDelete(form.id, 'all'))}>삭제</button>
                            {showDeleteOptions && (
                                <div className="delete-options-popover">
                                    <button onClick={() => onDelete(form.id, 'single', initData.clickDate)}>이 일정만 삭제</button>
                                    <button onClick={() => onDelete(form.id, 'future', initData.clickDate)}>이후 모두 삭제</button>
                                    <button onClick={() => onDelete(form.id, 'all')}>전체 삭제</button>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="main-btns" style={{ marginLeft: 'auto' }}>
                        <button className="btn-cancel" onClick={onClose}>취소</button>
                        <button className="btn-save" onClick={handleSave}>저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}