import React from 'react';

export default function ReminderSettings({ form, onChange }) {
    const options = [
        { label: '정시', value: 0 },
        { label: '10분 전', value: 10 },
        { label: '1시간 전', value: 60 }
    ];

    return (
        <>
            <div className="settings-row">
                <span className="label">🔔 알림</span>
                <input type="checkbox" checked={form.isNotificationEnabled} onChange={e => onChange('isNotificationEnabled', e.target.checked)} />
            </div>
            {form.isNotificationEnabled && (
                <div className="reminder-chips-container">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            className={`chip-item ${form.reminders.includes(opt.value) ? 'selected' : ''}`}
                            onClick={() => onChange('reminders', [opt.value])}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}