import { useState, useEffect } from 'react';

/**
 * [useEvents Custom Hook]
 * 캘린더의 모든 일정(Events) 데이터를 관리하는 전역 상태 훅입니다.
 * 로컬 스토리지와의 동기화, 일정 겹침 검사, 저장/수정/삭제 로직을 전담합니다.
 */
export function useEvents() {
    const [events, setEvents] = useState([]);

    // 1. 앱 초기 실행 시 로컬 스토리지에서 데이터 불러오기
    useEffect(() => {
        const saved = localStorage.getItem('calendar_events');
        if (saved) setEvents(JSON.parse(saved));
    }, []);

    // 2. events 상태가 변경될 때마다 자동으로 로컬 스토리지에 백업 (무결성 유지)
    useEffect(() => {
        localStorage.setItem('calendar_events', JSON.stringify(events));
    }, [events]);

    /**
     * [handleSaveEvent]
     * 새로운 일정을 생성하거나 기존 일정을 수정합니다.
     * @param {Object} data - 폼에서 입력받은 일정 데이터 객체
     * @param {String} mode - 수정 모드 ('all': 전체 수정, 'single': 이 일정만 수정)
     * @param {String} instanceDate - 'single' 모드일 경우 수정하려는 특정 인스턴스의 날짜
     * @returns {boolean} - 저장 성공 여부 (겹침 에러 시 false 반환)
     */
    const handleSaveEvent = (data, mode = 'all', instanceDate = null) => {
        const newStartMs = new Date(`${data.startDate}T${data.startTime || '00:00'}:00`).getTime();
        const newEndMs = new Date(`${data.endDate || data.startDate}T${data.endTime || '23:59'}:00`).getTime();

        // [충돌 검사] 하루 종일 일정이 아니고, 같은 시간대에 겹치는 다른 일정이 있는지 확인
        const isOverlap = events.some(ev => {
            if (ev.id === data.id || data.isAllDay || ev.isAllDay) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            // (A시작 < B종료) && (A종료 > B시작) 이면 두 시간은 겹친다
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            alert('해당 시간대에 이미 겹치는 일정이 있습니다. 다른 시간을 선택해주세요.');
            return false; // 방어 로직 발동
        }

        setEvents(prev => {
            const idx = prev.findIndex(e => e.id === data.id);

            // 기존에 존재하던 일정을 '수정'하는 경우
            if (idx > -1) {
                if (mode === 'all') {
                    // 전체 수정: 반복 설정이나 날짜 길이 등을 원본 기준으로 일괄 업데이트
                    const next = [...prev];
                    const originalEvent = prev[idx];
                    const sMs = new Date(`${data.startDate}T00:00:00`).getTime();
                    const eMs = new Date(`${data.endDate || data.startDate}T00:00:00`).getTime();
                    const diffDays = Math.round((eMs - sMs) / (1000 * 60 * 60 * 24));

                    const origStart = new Date(`${originalEvent.startDate}T00:00:00`);
                    const origEnd = new Date(origStart);
                    origEnd.setDate(origEnd.getDate() + diffDays);

                    next[idx] = {
                        ...data,
                        startDate: originalEvent.startDate,
                        endDate: `${origEnd.getFullYear()}-${String(origEnd.getMonth() + 1).padStart(2, '0')}-${String(origEnd.getDate()).padStart(2, '0')}`,
                        excludedDates: originalEvent.excludedDates || [],
                        repeatEndDate: originalEvent.repeatEndDate
                    };
                    return next;
                } else if (mode === 'single' && instanceDate) {
                    // 단일 수정: 원본 일정에서 해당 날짜(instanceDate)만 '예외(excluded)' 처리하고, 새로운 일정을 단일로 생성
                    const next = [...prev];
                    const currentExclusions = next[idx].excludedDates || [];
                    next[idx] = { ...next[idx], excludedDates: [...currentExclusions, instanceDate] };
                    const newStandaloneEvent = { ...data, id: Date.now().toString(), repeatUnit: 'none', repeatValue: 1, excludedDates: [], repeatEndDate: null };
                    return [...next, newStandaloneEvent];
                }
            }
            // 완전히 새로운 일정 '생성'하는 경우
            return [...prev, { ...data, excludedDates: [] }];
        });
        return true;
    };

    /**
     * [handleDeleteEvent]
     * 일정을 삭제합니다. 반복 일정의 경우 삭제 범위를 세밀하게 제어합니다.
     */
    const handleDeleteEvent = (eventId, instanceDate, mode = 'all') => {
        setEvents(prev => {
            const targetIdx = prev.findIndex(ev => ev.id === eventId);
            if (targetIdx === -1) return prev;
            const targetEvent = prev[targetIdx];

            // 단일 일정이거나 '모든 일정 삭제' 선택 시 배열에서 아예 날려버림
            if (mode === 'all' || !targetEvent.repeatUnit || targetEvent.repeatUnit === 'none') {
                return prev.filter(ev => ev.id !== eventId);
            }

            // '이 일정만 삭제' -> 원본 유지하되 해당 날짜만 예외(excludedDates) 목록에 추가하여 화면에서 가림
            if (mode === 'single') {
                const next = [...prev];
                const currentExclusions = next[targetIdx].excludedDates || [];
                next[targetIdx] = { ...next[targetIdx], excludedDates: [...currentExclusions, instanceDate] };
                return next;
            }

            // '이 이후 일정 삭제' -> 원본의 반복 종료일(repeatEndDate)을 삭제 요청일 하루 전으로 앞당겨버림
            if (mode === 'future') {
                const next = [...prev];
                const targetDate = new Date(`${instanceDate}T00:00:00`);
                targetDate.setDate(targetDate.getDate() - 1);
                next[targetIdx] = { ...next[targetIdx], repeatEndDate: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}` };
                return next;
            }
            return prev;
        });
    };

    /**
     * [handleUpdateEventDate]
     * 달력 화면에서 드래그 앤 드롭으로 일정을 움직였을 때 날짜/시간을 업데이트합니다.
     */
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
        updatedEnd.setDate(updatedEnd.getDate() + diffDays); // 드래그 시 기존 일정의 '기간(며칠짜리인지)'을 그대로 유지
        const formattedEnd = `${updatedEnd.getFullYear()}-${String(updatedEnd.getMonth() + 1).padStart(2, '0')}-${String(updatedEnd.getDate()).padStart(2, '0')}`;

        let updatedStartTime = targetEv.startTime || '00:00';
        let updatedEndTime = targetEv.endTime || '23:59';

        // 주간/일간 뷰에서 상하(시간축)로 드래그했을 경우 시간 재계산
        if (newStartTime && !targetEv.isAllDay) {
            updatedStartTime = newStartTime;
            const oldStartMins = parseInt(targetEv.startTime.split(':')[0]) * 60 + parseInt(targetEv.startTime.split(':')[1]);
            const oldEndMins = parseInt(targetEv.endTime.split(':')[0]) * 60 + parseInt(targetEv.endTime.split(':')[1]);
            const durationMins = oldEndMins - oldStartMins; // 기존에 설정해둔 회의 시간(Duration) 계산

            const newStartMins = parseInt(newStartTime.split(':')[0]) * 60 + parseInt(newStartTime.split(':')[1]);
            const newEndMins = newStartMins + durationMins; // 드롭한 시작 시간에 기존 기간만큼 더해서 종료 시간 산출

            let newEndHour = Math.floor(newEndMins / 60);
            let newEndMinute = newEndMins % 60;
            if (newEndHour >= 24) { newEndHour = 23; newEndMinute = 59; } // 밤 12시를 넘기지 못하도록 방어
            updatedEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;
        }

        // 이동하려는 목표 지점에 다른 일정이 버티고 있는지 최종 확인
        const newStartMs = new Date(`${newDate}T${updatedStartTime}:00`).getTime();
        const newEndMs = new Date(`${formattedEnd}T${updatedEndTime}:00`).getTime();
        const isOverlap = events.some(ev => {
            if (ev.id === eventId || targetEv.isAllDay || ev.isAllDay) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            alert('이동하려는 시간대에 이미 겹치는 일정이 있습니다.');
            return;
        }

        setEvents(prev => prev.map(ev => {
            if (ev.id === eventId) return { ...ev, startDate: newDate, endDate: formattedEnd, startTime: updatedStartTime, endTime: updatedEndTime };
            return ev;
        }));
    };

    return { events, handleSaveEvent, handleDeleteEvent, handleUpdateEventDate };
}