import { useState, useEffect } from 'react';

export function useEvents() {
    const [events, setEvents] = useState([]);

    // 초기 로드
    useEffect(() => {
        const saved = localStorage.getItem('calendar_events');
        if (saved) setEvents(JSON.parse(saved));
    }, []);

    // 변경 시 자동 저장
    useEffect(() => {
        localStorage.setItem('calendar_events', JSON.stringify(events));
    }, [events]);

    const handleSaveEvent = (data, mode = 'all', instanceDate = null) => {
        const newStartMs = new Date(`${data.startDate}T${data.startTime || '00:00'}:00`).getTime();
        const newEndMs = new Date(`${data.endDate || data.startDate}T${data.endTime || '23:59'}:00`).getTime();

        const isOverlap = events.some(ev => {
            if (ev.id === data.id) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            alert('해당 시간대에 이미 겹치는 일정이 있습니다. 다른 시간을 선택해주세요.');
            return false; // 저장 실패
        }

        setEvents(prev => {
            const idx = prev.findIndex(e => e.id === data.id);
            if (idx > -1) {
                if (mode === 'all') {
                    const next = [...prev];
                    const originalEvent = prev[idx];
                    const sMs = new Date(`${data.startDate}T00:00:00`).getTime();
                    const eMs = new Date(`${data.endDate || data.startDate}T00:00:00`).getTime();
                    const diffDays = Math.round((eMs - sMs) / (1000 * 60 * 60 * 24));
                    const origStart = new Date(`${originalEvent.startDate}T00:00:00`);
                    const origEnd = new Date(origStart);
                    origEnd.setDate(origEnd.getDate() + diffDays);
                    const y = origEnd.getFullYear();
                    const m = String(origEnd.getMonth() + 1).padStart(2, '0');
                    const d = String(origEnd.getDate()).padStart(2, '0');
                    next[idx] = {
                        ...data,
                        startDate: originalEvent.startDate,
                        endDate: `${y}-${m}-${d}`,
                        excludedDates: originalEvent.excludedDates || [],
                        repeatEndDate: originalEvent.repeatEndDate
                    };
                    return next;
                } else if (mode === 'single' && instanceDate) {
                    const next = [...prev];
                    const currentExclusions = next[idx].excludedDates || [];
                    next[idx] = { ...next[idx], excludedDates: [...currentExclusions, instanceDate] };
                    const newStandaloneEvent = { ...data, id: Date.now().toString(), repeatUnit: 'none', repeatValue: 1, excludedDates: [], repeatEndDate: null };
                    return [...next, newStandaloneEvent];
                }
            }
            return [...prev, { ...data, excludedDates: [] }];
        });
        return true; // 저장 성공
    };

    const handleDeleteEvent = (eventId, instanceDate, mode = 'all') => {
        setEvents(prev => {
            const targetIdx = prev.findIndex(ev => ev.id === eventId);
            if (targetIdx === -1) return prev;
            const targetEvent = prev[targetIdx];

            if (mode === 'all' || !targetEvent.repeatUnit || targetEvent.repeatUnit === 'none') return prev.filter(ev => ev.id !== eventId);
            if (mode === 'single') {
                const next = [...prev];
                const currentExclusions = next[targetIdx].excludedDates || [];
                next[targetIdx] = { ...next[targetIdx], excludedDates: [...currentExclusions, instanceDate] };
                return next;
            }
            if (mode === 'future') {
                const next = [...prev];
                const targetDate = new Date(`${instanceDate}T00:00:00`);
                targetDate.setDate(targetDate.getDate() - 1);
                const y = targetDate.getFullYear();
                const m = String(targetDate.getMonth() + 1).padStart(2, '0');
                const d = String(targetDate.getDate()).padStart(2, '0');
                next[targetIdx] = { ...next[targetIdx], repeatEndDate: `${y}-${m}-${d}` };
                return next;
            }
            return prev;
        });
    };

    const handleUpdateEventDate = (eventId, newDate, newStartTime = null) => {
        const targetEv = events.find(e => e.id === eventId);
        if (!targetEv) return;

        if (targetEv.repeatUnit && targetEv.repeatUnit !== 'none') {
            alert('반복 일정은 드래그로 이동할 수 없습니다. 클릭해서 수정해주세요.');
            return;
        }

        const oldStart = new Date(targetEv.startDate);
        const oldEnd = new Date(targetEv.endDate || targetEv.startDate);
        const diffDays = Math.round((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));

        const updatedStart = new Date(newDate);
        const updatedEnd = new Date(updatedStart);
        updatedEnd.setDate(updatedEnd.getDate() + diffDays);
        const y = updatedEnd.getFullYear();
        const m = String(updatedEnd.getMonth() + 1).padStart(2, '0');
        const d = String(updatedEnd.getDate()).padStart(2, '0');
        const formattedEnd = `${y}-${m}-${d}`;

        let updatedStartTime = targetEv.startTime || '00:00';
        let updatedEndTime = targetEv.endTime || '23:59';

        if (newStartTime) {
            updatedStartTime = newStartTime;
            const oldStartMins = parseInt(targetEv.startTime.split(':')[0]) * 60 + parseInt(targetEv.startTime.split(':')[1]);
            const oldEndMins = parseInt(targetEv.endTime.split(':')[0]) * 60 + parseInt(targetEv.endTime.split(':')[1]);
            const durationMins = oldEndMins - oldStartMins;

            const newStartMins = parseInt(newStartTime.split(':')[0]) * 60 + parseInt(newStartTime.split(':')[1]);
            const newEndMins = newStartMins + durationMins;

            let newEndHour = Math.floor(newEndMins / 60);
            let newEndMinute = newEndMins % 60;
            if (newEndHour >= 24) { newEndHour = 23; newEndMinute = 59; }
            updatedEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;
        }

        const newStartMs = new Date(`${newDate}T${updatedStartTime}:00`).getTime();
        const newEndMs = new Date(`${formattedEnd}T${updatedEndTime}:00`).getTime();

        const isOverlap = events.some(ev => {
            if (ev.id === eventId) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            alert('이동하려는 시간대에 이미 겹치는 일정이 있습니다.');
            return;
        }

        setEvents(prev => prev.map(ev => {
            if (ev.id === eventId) {
                return { ...ev, startDate: newDate, endDate: formattedEnd, startTime: updatedStartTime, endTime: updatedEndTime };
            }
            return ev;
        }));
    };

    return { events, handleSaveEvent, handleDeleteEvent, handleUpdateEventDate };
}