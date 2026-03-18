import React from 'react';

export default function RepeatSettings({ form, onChange }) {
    // until이 null이면 '종료일 없음', 값이 있으면 '날짜 지정' 상태
    const isNoLimit = !form.until;

    const handleRepeatChange = (val) => {
        onChange('repeat', val);
        if (val !== 'none') {
            onChange('until', null); // 반복 선택 시 기본은 종료일 없음
        }
    };

    return (
        <>
            <div className="settings-row">
                <span className="label">🔁 반복</span>
                <select
                    className="repeat-select-ui"
                    value={form.repeat || 'none'}
                    onChange={e => handleRepeatChange(e.target.value)}
                >
                    <option value="none">반복 안 함</option>
                    <option value="daily">매일</option>
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                    <option value="yearly">매년</option>
                </select>
            </div>

            {form.repeat && form.repeat !== 'none' && (
                <div className="until-container">
                    <div className="settings-row">
                        <span className="sub-label">종료일</span>
                        {isNoLimit ? (
                            /* 종료일이 없을 때만 버튼 표시 */
                            <button
                                className="no-limit-btn active"
                                onClick={() => onChange('until', form.date)}
                            >
                                계속 반복
                            </button>
                        ) : (
                            /* 종료일을 설정하면 버튼은 숨겨지고 날짜 선택창만 표시 */
                            <div className="until-input-wrapper">
                                <input
                                    type="date"
                                    value={form.until}
                                    onChange={e => onChange('until', e.target.value)}
                                />
                                <button className="reset-until-btn" onClick={() => onChange('until', null)}>
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}