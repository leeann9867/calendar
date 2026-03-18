import React, { useState } from 'react';

const OPTIONS = [
    { label: '일정 시작 시간', value: 0 },
    { label: '10분 전', value: 10 },
    { label: '1시간 전', value: 60 },
    { label: '1일 전', value: 1440 },
];

function ReminderSettings({ form, setForm }) {
    const [isCustom, setIsCustom] = useState(false);
    const [customVal, setCustomVal] = useState('');

    const toggleReminder = (val) => {
        const current = form.reminders || [];
        const next = current.includes(val) ? [] : [val];
        setForm({ ...form, reminders: next });
    };

    return (
        <div className="reminder-component">
            <div className="reminder-list-card">
                {OPTIONS.map(opt => (
                    <div key={opt.value} className={`reminder-item ${form.reminders?.includes(opt.value) ? 'active' : ''}`} onClick={() => toggleReminder(opt.value)}>
                        <div className="check-circle">{form.reminders?.includes(opt.value) && '✓'}</div>
                        <span>{opt.label}</span>
                    </div>
                ))}
                {isCustom ? (
                    <div className="reminder-item">
                        <input type="number" value={customVal} onChange={(e)=>setCustomVal(e.target.value)} placeholder="분 단위" autoFocus />
                        <button onClick={() => { toggleReminder(parseInt(customVal)); setIsCustom(false); }}>확인</button>
                    </div>
                ) : (
                    <div className="reminder-item custom-add" onClick={() => setIsCustom(true)}>+ 직접 설정</div>
                )}
            </div>

            <div className="reminder-list-card" style={{marginTop: '12px'}}>
                <div className="reminder-item justify-between">
                    <span>알림 받지 않는 날 설정</span>
                    <label className="ios-switch">
                        <input
                            type="checkbox"
                            checked={form.isNotificationEnabled === false}
                            onChange={() => setForm({...form, isNotificationEnabled: !form.isNotificationEnabled})}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
        </div>
    );
}

export default ReminderSettings;