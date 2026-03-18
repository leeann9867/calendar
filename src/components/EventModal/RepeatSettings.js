import React from 'react';

export default function RepeatSettings({ form, onChange }) {
    const isNoLimit = !form.until;

    return (
        <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '600' }}>🔁 반복 설정</span>
                <select
                    value={form.repeat || 'none'}
                    onChange={e => {
                        const val = e.target.value;
                        onChange('repeat', val);
                        if (val !== 'none') onChange('until', null);
                    }}
                    style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                    <option value="none">반복 안 함</option>
                    <option value="daily">매일</option>
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                    <option value="yearly">매년</option>
                </select>
            </div>

            {form.repeat && form.repeat !== 'none' && (
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '12px' }}>
                    {isNoLimit ? (
                        <button
                            onClick={() => onChange('until', form.date)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #007aff',
                                borderRadius: '8px',
                                background: '#fff',
                                color: '#007aff',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            종료일 없음 (계속 반복)
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="date"
                                value={form.until}
                                onChange={e => onChange('until', e.target.value)}
                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                            <button
                                onClick={() => onChange('until', null)}
                                style={{ background: '#eee', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}