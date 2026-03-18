import React from 'react';

export default function NotificationSettings({ form, onChange }) {
    const reminderOptions = [
        { label: '10분 전', value: 10 },
        { label: '30분 전', value: 30 },
        { label: '1시간 전', value: 60 },
        { label: '1일 전', value: 1440 },
    ];

    const handleToggle = () => {
        onChange('isNotificationEnabled', !form.isNotificationEnabled);
    };

    const handleReminderChange = (e) => {
        onChange('reminders', [parseInt(e.target.value)]);
    };

    return (
        <div className="modal-section notification-section">
            <div className="settings-row">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔔 알림 설정
        </span>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={form.isNotificationEnabled}
                        onChange={handleToggle}
                    />
                    <span className="slider round"></span>
                </label>
            </div>

            {form.isNotificationEnabled && (
                <div className="reminder-selector-wrapper" style={{ marginTop: '10px', animation: 'fadeIn 0.3s' }}>
                    <select
                        value={form.reminders ? form.reminders[0] : 10}
                        onChange={handleReminderChange}
                        className="select-styled"
                    >
                        {reminderOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}