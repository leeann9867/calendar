import React, { useState, useEffect, useRef } from 'react';
import { getFormatDate } from '../../utils/calendarUtils';

const COLOR_PRESETS = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#007aff', '#5856d6', '#af52de'];
const DEFAULT_TAGS = ['공부', '기념일', '여가'];

const PRESET_ALARMS = [
    { label: '정각', value: 0 },
    { label: '10분 전', value: 10 },
    { label: '1시간 전', value: 60 },
    { label: '1일 전', value: 1440 }
];

const formatAlarmText = (mins) => {
    if (mins === 0) return '정각';
    if (mins % 1440 === 0) return `${mins / 1440}일 전`;
    if (mins % 60 === 0) return `${mins / 60}시간 전`;
    return `${mins}분 전`;
};

const DateWheel = ({ value, onChange, minDate }) => {
    const [yStr, mStr, dStr] = (value || getFormatDate(new Date())).split('-');
    let year = parseInt(yStr, 10) || new Date().getFullYear();
    let month = parseInt(mStr, 10) || 1;
    let day = parseInt(dStr, 10) || 1;

    const updateDate = (y, m, d) => {
        const dateObj = new Date(y, m - 1, d);
        const minObj = minDate ? new Date(minDate) : new Date('1970-01-01');
        if (dateObj < minObj) onChange(getFormatDate(minObj));
        else onChange(getFormatDate(dateObj));
    };

    const handleWheel = (e, type) => {
        const step = e.deltaY > 0 ? -1 : 1;
        if (type === 'y') updateDate(year + step, month, day);
        else if (type === 'm') updateDate(year, month + step, day);
        else updateDate(year, month, day + step);
    };

    const startY = useRef(0);
    const handleDragStart = (e) => { startY.current = e.clientY ?? (e.touches && e.touches[0].clientY); };
    const handleDragMove = (e, type) => {
        if (!startY.current) return;
        const y = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        if (y === null) return;
        const diff = y - startY.current;
        if (Math.abs(diff) > 15) {
            const step = diff > 0 ? -1 : 1;
            if (type === 'y') updateDate(year + step, month, day);
            else if (type === 'm') updateDate(year, month + step, day);
            else updateDate(year, month, day + step);
            startY.current = y;
        }
    };
    const handleDragEnd = () => { startY.current = 0; };

    return (
        <div className="custom-time-picker" style={{ gap: '2px', padding: '4px 8px' }}>
            <div className="time-wheel-unit" onWheel={(e) => handleWheel(e, 'y')} onMouseDown={handleDragStart} onMouseMove={(e)=>handleDragMove(e, 'y')} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchStart={handleDragStart} onTouchMove={(e)=>handleDragMove(e, 'y')} onTouchEnd={handleDragEnd}>{year}</div>
            <span style={{fontWeight: 800, color: 'var(--text-muted)', margin: '0 2px'}}>.</span>
            <div className="time-wheel-unit" onWheel={(e) => handleWheel(e, 'm')} onMouseDown={handleDragStart} onMouseMove={(e)=>handleDragMove(e, 'm')} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchStart={handleDragStart} onTouchMove={(e)=>handleDragMove(e, 'm')} onTouchEnd={handleDragEnd}>{String(month).padStart(2, '0')}</div>
            <span style={{fontWeight: 800, color: 'var(--text-muted)', margin: '0 2px'}}>.</span>
            <div className="time-wheel-unit" onWheel={(e) => handleWheel(e, 'd')} onMouseDown={handleDragStart} onMouseMove={(e)=>handleDragMove(e, 'd')} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchStart={handleDragStart} onTouchMove={(e)=>handleDragMove(e, 'd')} onTouchEnd={handleDragEnd}>{String(day).padStart(2, '0')}</div>
        </div>
    );
};

const TimeWheel = ({ value, onChange }) => {
    const [hourStr, minStr] = (value || '09:00').split(':');
    let hour = parseInt(hourStr, 10); let min = parseInt(minStr, 10);
    if (isNaN(hour)) hour = 9; if (isNaN(min)) min = 0;

    const updateTime = (h, m) => {
        const newH = String((h + 24) % 24).padStart(2, '0');
        const newM = String((m + 60) % 60).padStart(2, '0');
        onChange(`${newH}:${newM}`);
    };

    const handleWheel = (e, type) => {
        const step = e.deltaY > 0 ? -1 : 1;
        if (type === 'h') updateTime(hour + step, min); else updateTime(hour, min + step);
    };

    const startY = useRef(0);
    const handleDragStart = (e) => { startY.current = e.clientY ?? (e.touches && e.touches[0].clientY); };
    const handleDragMove = (e, type) => {
        if (!startY.current) return;
        const y = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : null);
        if (y === null) return;
        const diff = y - startY.current;
        if (Math.abs(diff) > 15) {
            const step = diff > 0 ? -1 : 1;
            if (type === 'h') updateTime(hour + step, min); else updateTime(hour, min + step);
            startY.current = y;
        }
    };
    const handleDragEnd = () => { startY.current = 0; };

    return (
        <div className="custom-time-picker">
            <div className="time-wheel-unit" onWheel={(e) => handleWheel(e, 'h')} onMouseDown={handleDragStart} onMouseMove={(e)=>handleDragMove(e, 'h')} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchStart={handleDragStart} onTouchMove={(e)=>handleDragMove(e, 'h')} onTouchEnd={handleDragEnd}>{String(hour).padStart(2, '0')}</div>
            <span style={{fontWeight: 800, color: 'var(--text-main)'}}>:</span>
            <div className="time-wheel-unit" onWheel={(e) => handleWheel(e, 'm')} onMouseDown={handleDragStart} onMouseMove={(e)=>handleDragMove(e, 'm')} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchStart={handleDragStart} onTouchMove={(e)=>handleDragMove(e, 'm')} onTouchEnd={handleDragEnd}>{String(min).padStart(2, '0')}</div>
        </div>
    );
};

function EventForm({ selectedDate, initData, onSave, onDelete, onClose, events, openConfirm }) {

    // 🌟 [버그 픽스] 알림 파서(해독기) 알고리즘 수정
    const parsedAlarms = (() => {
        if (!initData) return [10]; // 오직 '+버튼'으로 새 일정을 만들 때만 10분 전 기본값!

        const raw = initData.alarms ?? initData.alarm;
        if (raw === '' || raw === null || raw === undefined) return []; // 빈 값이면 철저하게 빈 배열! (10분 좀비 차단)

        if (Array.isArray(raw)) return raw.map(Number);
        if (typeof raw === 'number') return [raw];
        if (typeof raw === 'string') {
            try {
                const p = JSON.parse(raw);
                if(Array.isArray(p)) return p.map(Number);
                return raw.split(',').map(Number).filter(n => !isNaN(n));
            } catch {
                return raw.split(',').map(Number).filter(n => !isNaN(n));
            }
        }
        return [];
    })();

    const parsedIsAlarmOn = initData
        ? (initData.isAlarmOn === true || initData.isAlarmOn === 1 || initData.isAlarmOn === 'true')
        : true; // 새 일정일 땐 ON이 기본

    const [formData, setFormData] = useState({
        title: '', startDate: selectedDate || getFormatDate(new Date()), startTime: '09:00',
        endDate: selectedDate || getFormatDate(new Date()), endTime: '10:00',
        isAllDay: false, tag: '', color: '#007aff', memo: '',
        repeatUnit: 'none', repeatValue: 1, repeatEndDate: '',
        ...initData,
        isAlarmOn: parsedIsAlarmOn,
        alarms: parsedAlarms
    });

    const [customAlarmVal, setCustomAlarmVal] = useState(30);
    const [customAlarmUnit, setCustomAlarmUnit] = useState(1);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleTimeChange = (name, val) => setFormData(prev => ({ ...prev, [name]: val }));
    const handleColorClick = (color) => setFormData(prev => ({ ...prev, color }));

    const handleAlarmToggle = (minutes) => {
        setFormData(prev => {
            const currentAlarms = prev.alarms || [];
            if (currentAlarms.includes(minutes)) {
                return { ...prev, alarms: currentAlarms.filter(a => a !== minutes) };
            } else {
                return { ...prev, alarms: [...currentAlarms, minutes].sort((a,b) => a-b) };
            }
        });
    };

    const addCustomAlarm = () => {
        if (!customAlarmVal || customAlarmVal <= 0) return;
        const minutes = parseInt(customAlarmVal, 10) * customAlarmUnit;
        setFormData(prev => {
            const currentAlarms = prev.alarms || [];
            if (!currentAlarms.includes(minutes)) {
                return { ...prev, alarms: [...currentAlarms, minutes].sort((a,b) => a-b) };
            }
            return prev;
        });
    };

    const getRankedTags = () => {
        const counts = {};
        events.forEach(ev => {
            if (ev.tag && ev.tag.trim() !== '') counts[ev.tag] = (counts[ev.tag] || 0) + 1;
        });
        const allTagsSet = new Set([...Object.keys(counts), ...DEFAULT_TAGS]);
        return Array.from(allTagsSet).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
    };

    const rankedTags = getRankedTags();

    const getMinRepeatDate = () => {
        if (!formData.startDate) return getFormatDate(new Date());
        const d = new Date(formData.startDate);
        if (formData.repeatUnit === 'daily') d.setDate(d.getDate() + 1);
        else if (formData.repeatUnit === 'weekly') d.setDate(d.getDate() + 7);
        else if (formData.repeatUnit === 'monthly') d.setMonth(d.getMonth() + 1);
        return getFormatDate(d);
    };

    useEffect(() => {
        if (formData.repeatUnit !== 'none') {
            const minDate = getMinRepeatDate();
            if (!formData.repeatEndDate || formData.repeatEndDate < minDate) {
                setFormData(prev => ({ ...prev, repeatEndDate: minDate }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.repeatUnit, formData.startDate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            openConfirm("입력 오류", "일정 제목을 입력해주세요.", []); return;
        }

        // 🌟 [버그 픽스] 알림이 꺼져있다면 DB로 보낼 때 알림 데이터를 싹 다 비워버립니다! (유령 알람 차단)
        const payload = {
            ...formData,
            alarms: formData.isAlarmOn && formData.alarms && formData.alarms.length > 0
                ? formData.alarms.sort((a,b)=>a-b).join(',')
                : '',
            isAlarmOn: formData.isAlarmOn ? 1 : 0
        };

        if (payload.id && payload.repeatUnit !== 'none') {
            openConfirm("반복 일정 수정", "수정할 범위를 선택해주세요.", [
                { label: "이 일정만 수정", action: () => onSave(payload, 'single', payload.startDate), className: "sub-btn" },
                { label: "모든 반복 일정 수정", action: () => onSave(payload, 'all'), className: "sub-btn" }
            ]);
        } else onSave(payload, 'all');
    };

    const handleDeleteClick = () => {
        if (!formData.id) return;
        if (formData.repeatUnit !== 'none') {
            openConfirm("반복 일정 삭제", "삭제할 범위를 선택해주세요.", [
                { label: "이 일정만 삭제", action: () => onDelete(formData.id, formData.startDate, 'single'), className: "sub-btn delete-all" },
                { label: "이 시점 이후 삭제", action: () => onDelete(formData.id, formData.startDate, 'following'), className: "sub-btn delete-all" },
                { label: "전체 삭제", action: () => onDelete(formData.id, null, 'all'), className: "sub-btn delete-all" }
            ]);
        } else {
            openConfirm("일정 삭제", "정말 이 일정을 삭제하시겠습니까?", [
                { label: "삭제하기", action: () => onDelete(formData.id, null, 'all'), className: "sub-btn delete-all" }
            ]);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <div className="modal-header-samsung">
                <input name="title" value={formData.title} onChange={handleChange} placeholder="일정 제목" autoFocus />
            </div>

            <div className="samsung-body">
                <div className="samsung-row align-top">
                    <div className="icon-area" style={{ marginTop: '10px' }}>🕒</div>
                    <div className="content-area custom-time-area">
                        <div className="time-block"><DateWheel value={formData.startDate} onChange={(v) => handleTimeChange('startDate', v)} />{!formData.isAllDay && <TimeWheel value={formData.startTime} onChange={(v) => handleTimeChange('startTime', v)} />}</div>
                        <div className="time-block"><span className="time-divider">~</span><DateWheel value={formData.endDate} onChange={(v) => handleTimeChange('endDate', v)} minDate={formData.startDate} />{!formData.isAllDay && <TimeWheel value={formData.endTime} onChange={(v) => handleTimeChange('endTime', v)} />}</div>
                    </div>
                </div>

                <div className="samsung-row">
                    <div className="icon-area">✅</div>
                    <div className="content-area"><label style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" name="isAllDay" checked={formData.isAllDay} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />하루 종일</label></div>
                </div>

                <div className="samsung-row align-top">
                    <div className="icon-area" style={{ marginTop: '10px' }}>🔔</div>
                    <div className="content-area" style={{ flexWrap: 'wrap', gap: '10px', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                        <label style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" name="isAlarmOn" checked={formData.isAlarmOn} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
                            알림 켜기
                        </label>
                        {formData.isAlarmOn && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', paddingLeft: '15px', borderLeft: '2px solid var(--border-color)', marginLeft: '8px', marginTop: '5px' }}>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                    {PRESET_ALARMS.map(preset => (
                                        <label key={preset.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: 'var(--text-main)', cursor: 'pointer' }}><input type="checkbox" checked={(formData.alarms || []).includes(preset.value)} onChange={() => handleAlarmToggle(preset.value)} />{preset.label}</label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <input type="number" className="reminder-num" value={customAlarmVal} onChange={e => setCustomAlarmVal(e.target.value)} min="1" style={{ width: '60px' }} />
                                    <select className="reminder-select" value={customAlarmUnit} onChange={e => setCustomAlarmUnit(Number(e.target.value))}><option value={1}>분 전</option><option value={60}>시간 전</option><option value={1440}>일 전</option></select>
                                    <button type="button" onClick={addCustomAlarm} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--sat-blue)', background: 'transparent', color: 'var(--sat-blue)', fontWeight: 'bold', cursor: 'pointer' }}>추가</button>
                                </div>
                                {(formData.alarms || []).length > 0 && (
                                    <div className="tag-list" style={{ marginTop: '5px' }}>
                                        {[...(formData.alarms || [])].sort((a,b)=>a-b).map(a => (
                                            <div key={a} className="tag-item active" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>{formatAlarmText(a)}<span style={{ cursor: 'pointer', fontWeight: 'bold', marginLeft: '2px' }} onClick={() => handleAlarmToggle(a)}>✕</span></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="samsung-row">
                    <div className="icon-area">🏷️</div>
                    <div className="content-area" style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                        <input type="text" name="tag" className="date-input" value={formData.tag} onChange={handleChange} placeholder="태그 입력 (선택)" style={{ flex: '1 1 120px', minWidth: 0 }} />
                        <select className="reminder-select" style={{ flex: '1 1 100px', minWidth: 0 }} value={rankedTags.includes(formData.tag) ? formData.tag : ""} onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}><option value="" disabled>기존 태그 선택</option>{rankedTags.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    </div>
                </div>

                <div className="samsung-row align-top">
                    <div className="icon-area" style={{ marginTop: '10px' }}>🔁</div>
                    <div className="content-area" style={{ flexWrap: 'wrap', gap: '10px', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <select name="repeatUnit" className="reminder-select" value={formData.repeatUnit} onChange={handleChange}><option value="none">반복 안 함</option><option value="daily">일</option><option value="weekly">주</option><option value="monthly">월</option></select>
                        {formData.repeatUnit !== 'none' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                                <input type="number" name="repeatValue" className="reminder-num" value={formData.repeatValue} onChange={handleChange} min="1" />
                                <span style={{ fontWeight: 600, color: 'var(--text-main)', marginRight: '10px' }}>{formData.repeatUnit === 'daily' ? '일마다' : formData.repeatUnit === 'weekly' ? '주마다' : '개월마다'}</span>
                                <span className="time-divider" style={{ paddingLeft: 0 }}>종료:</span>
                                <DateWheel value={formData.repeatEndDate} onChange={(v) => handleTimeChange('repeatEndDate', v)} minDate={getMinRepeatDate()} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="samsung-row"><div className="icon-area">🎨</div><div className="content-area color-picker-area">{COLOR_PRESETS.map(c => <div key={c} className={`color-preset-circle ${formData.color === c ? 'active' : ''}`} style={{ backgroundColor: c }} onClick={() => handleColorClick(c)} />)}</div></div>
                <div className="samsung-row align-top"><div className="icon-area" style={{ marginTop: '10px' }}>📝</div><div className="content-area"><textarea name="memo" className="memo-input" value={formData.memo} onChange={handleChange} placeholder="메모를 입력하세요..." /></div></div>
            </div>

            <div className="modal-footer">
                {formData.id && <button type="button" onClick={handleDeleteClick} className="btn btn-delete">삭제</button>}
                <button type="button" onClick={onClose} className="btn btn-cancel">취소</button>
                <button type="submit" className="btn btn-save">저장</button>
            </div>
        </form>
    );
}

export default EventForm;