import React, { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import RepeatSettings from './RepeatSettings';
import ReminderSettings from './ReminderSettings';

function EventModal({ initData, onSave, onDelete, onClose }) {
    const [form, setForm] = useState({
        title: '',
        date: '',
        time: '09:00',
        endTime: '10:00',
        reminders: [5],
        excludedDays: [],
        repeat: 'none',
        color: 'ev-blue'
    });

    useEffect(() => {
        if (initData) {
            setForm({
                ...form,
                ...initData,
                reminders: Array.isArray(initData.reminders)
                    ? initData.reminders
                    : (initData.reminder ? [parseInt(initData.reminder)] : [5]),
                excludedDays: initData.excludedDays || []
            });
        }
    }, [initData]);

    const handleSave = () => {
        if (!form.title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }
        onSave({ ...form, id: form.id || Date.now() });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                {/* 제목 */}
                <input
                    className="input-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="일정 제목 추가"
                    autoFocus
                />

                {/* 날짜와 시간 */}
                <div className="form-row">
                    <div className="form-group">
                        <label>날짜</label>
                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>시간</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* --------------------------------------------------------- */}
                {/* 🚀 여기가 빠져있었을 거예요! 알림 설정 추가 섹션 */}
                <div className="reminder-section" style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <ReminderSettings
                        reminders={form.reminders || []}
                        setReminders={(vals) => setForm({ ...form, reminders: vals })}
                    />
                </div>

                {/* 특정 날짜 알림 토글 */}
                <div className="form-group">
                    <button
                        type="button"
                        className={`btn-exclude-toggle ${form.excludedDays?.includes(form.date) ? 'active' : ''}`}
                        onClick={() => {
                            const today = form.date;
                            const newExcludes = form.excludedDays.includes(today)
                                ? form.excludedDays.filter(d => d !== today)
                                : [...form.excludedDays, today];
                            setForm({ ...form, excludedDays: newExcludes });
                        }}
                    >
                        {form.excludedDays?.includes(form.date) ? '🔔 이 날짜 알림 다시 켜기' : '🔇 이 날짜 알림만 끄기'}
                    </button>
                </div>
                {/* --------------------------------------------------------- */}

                {/* 반복 설정 */}
                <RepeatSettings form={form} setForm={setForm} />

                {/* 색상 선택 */}
                <div className="form-group">
                    <label>색상 선택</label>
                    <ColorPicker
                        selectedColor={form.color}
                        onSelect={(c) => setForm({ ...form, color: c })}
                    />
                </div>

                {/* 버튼들 */}
                <div className="btn-group">
                    {form.id && (
                        <button className="btn-delete" onClick={() => onDelete(form.id)}>삭제</button>
                    )}
                    <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                        <button className="btn-close" onClick={onClose}>취소</button>
                        <button className="btn-save" onClick={handleSave}>저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EventModal;