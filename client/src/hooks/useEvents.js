import { useState, useEffect } from 'react';

/**
 * [useEvents Custom Hook (DB 연동 버전)]
 * 로컬 스토리지가 아닌, Node.js + SQLite 백엔드 서버와 통신하여 일정을 관리합니다.
 * 생성(POST), 수정(PUT), 삭제(DELETE), 조회(GET) 기능이 모두 포함되어 있습니다.
 */
export function useEvents() {
    const [events, setEvents] = useState([]);
    const API_URL = 'http://localhost:5000/api/events'; // Express 서버 주소

    // ========================================================
    // 1. 초기 로드: 서버(DB)에서 모든 일정 가져오기 (GET)
    // ========================================================
    useEffect(() => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setEvents(data);
            })
            .catch(err => console.error("DB 불러오기 실패:", err));
    }, []);

    // ========================================================
    // [내부 유틸] DB에 저장/수정 요청을 보내는 공통 함수
    // ========================================================
    const saveToDB = async (eventData, isUpdate = false) => {
        const url = isUpdate ? `${API_URL}/${eventData.id}` : API_URL;
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
        } catch (err) {
            console.error("DB 저장 오류:", err);
        }
    };

    // ========================================================
    // 2. 일정 생성 및 수정 (POST, PUT)
    // ========================================================
    const handleSaveEvent = (data, mode = 'all', instanceDate = null) => {
        const newStartMs = new Date(`${data.startDate}T${data.startTime || '00:00'}:00`).getTime();
        const newEndMs = new Date(`${data.endDate || data.startDate}T${data.endTime || '23:59'}:00`).getTime();

        // [충돌 검사] 하루 종일 일정이 아니고, 같은 시간대에 겹치는 다른 일정이 있는지 확인
        const isOverlap = events.some(ev => {
            if (ev.id === data.id || data.isAllDay || ev.isAllDay) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            alert('해당 시간대에 이미 겹치는 일정이 있습니다. 다른 시간을 선택해주세요.');
            return false; // 방어 로직 발동
        }

        setEvents(prev => {
            const idx = prev.findIndex(e => e.id === data.id);

            // 기존에 존재하던 일정을 '수정(Update)'하는 경우
            if (idx > -1) {
                if (mode === 'all') {
                    // 전체 수정: 원본 기준으로 일괄 업데이트
                    const next = [...prev];
                    const originalEvent = prev[idx];
                    const sMs = new Date(`${data.startDate}T00:00:00`).getTime();
                    const eMs = new Date(`${data.endDate || data.startDate}T00:00:00`).getTime();
                    const diffDays = Math.round((eMs - sMs) / (1000 * 60 * 60 * 24));

                    const origStart = new Date(`${originalEvent.startDate}T00:00:00`);
                    const origEnd = new Date(origStart);
                    origEnd.setDate(origEnd.getDate() + diffDays);

                    const updatedEvent = {
                        ...data,
                        startDate: originalEvent.startDate,
                        endDate: `${origEnd.getFullYear()}-${String(origEnd.getMonth() + 1).padStart(2, '0')}-${String(origEnd.getDate()).padStart(2, '0')}`,
                        excludedDates: originalEvent.excludedDates || [],
                        repeatEndDate: originalEvent.repeatEndDate
                    };
                    next[idx] = updatedEvent;

                    saveToDB(updatedEvent, true); // 서버로 PUT 요청
                    return next;
                }
                else if (mode === 'single' && instanceDate) {
                    // 단일 수정: 해당 날짜만 예외 처리하고 새로운 일정을 독립적으로 생성
                    const next = [...prev];
                    const currentExclusions = next[idx].excludedDates || [];
                    next[idx] = { ...next[idx], excludedDates: [...currentExclusions, instanceDate] };

                    const newStandaloneEvent = {
                        ...data, id: Date.now().toString(), repeatUnit: 'none', repeatValue: 1, excludedDates: [], repeatEndDate: null
                    };

                    saveToDB(next[idx], true); // 기존 반복 일정 예외처리 업데이트 (PUT)
                    saveToDB(newStandaloneEvent, false); // 새 단일 일정 저장 (POST)
                    return [...next, newStandaloneEvent];
                }
            }

            // 완전히 새로운 일정 '생성(Create)'하는 경우
            const newEvent = { ...data, excludedDates: [] };
            saveToDB(newEvent, false); // 서버로 POST 요청
            return [...prev, newEvent];
        });

        return true;
    };

    // ========================================================
    // 3. 일정 삭제 (DELETE)
    // ========================================================
    const handleDeleteEvent = (eventId, instanceDate, mode = 'all') => {
        setEvents(prev => {
            const targetIdx = prev.findIndex(ev => ev.id === eventId);
            if (targetIdx === -1) return prev;
            const targetEvent = prev[targetIdx];

            // 단일 일정 삭제 또는 '모든 반복 일정 삭제'인 경우
            if (mode === 'all' || !targetEvent.repeatUnit || targetEvent.repeatUnit === 'none') {
                fetch(`${API_URL}/${eventId}`, { method: 'DELETE' }).catch(err => console.error("삭제 오류:", err));
                return prev.filter(ev => ev.id !== eventId);
            }

            // '이 일정만 삭제' -> 예외(excludedDates) 목록에 추가하여 숨김
            if (mode === 'single') {
                const next = [...prev];
                const currentExclusions = next[targetIdx].excludedDates || [];
                next[targetIdx] = { ...next[targetIdx], excludedDates: [...currentExclusions, instanceDate] };

                saveToDB(next[targetIdx], true); // 변경된 예외 목록을 서버에 업데이트 (PUT)
                return next;
            }

            // '이 이후 일정 삭제' -> 반복 종료일(repeatEndDate)을 앞당김
            if (mode === 'future') {
                const next = [...prev];
                const targetDate = new Date(`${instanceDate}T00:00:00`);
                targetDate.setDate(targetDate.getDate() - 1);
                next[targetIdx] = {
                    ...next[targetIdx],
                    repeatEndDate: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
                };

                saveToDB(next[targetIdx], true); // 변경된 종료일을 서버에 업데이트 (PUT)
                return next;
            }
            return prev;
        });
    };

    // ========================================================
    // 4. 드래그 앤 드롭 일정 이동 (PUT)
    // ========================================================
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
        const formattedEnd = `${updatedEnd.getFullYear()}-${String(updatedEnd.getMonth() + 1).padStart(2, '0')}-${String(updatedEnd.getDate()).padStart(2, '0')}`;

        let updatedStartTime = targetEv.startTime || '00:00';
        let updatedEndTime = targetEv.endTime || '23:59';

        if (newStartTime && !targetEv.isAllDay) {
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
            if (ev.id === eventId) {
                const updatedEvent = { ...ev, startDate: newDate, endDate: formattedEnd, startTime: updatedStartTime, endTime: updatedEndTime };
                saveToDB(updatedEvent, true); // 변경된 시간/날짜를 서버에 업데이트 (PUT)
                return updatedEvent;
            }
            return ev;
        }));
    };

    return { events, handleSaveEvent, handleDeleteEvent, handleUpdateEventDate };
}