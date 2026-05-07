import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast'; // 🌟 예쁜 토스트 알림 라이브러리 추가

/**
 * 전각(Full-width) 숫자를 반각(Half-width)으로 예쁘게 바꿔주는 필터
 * (예: ２０２６ -> 2026)
 */
const cleanString = (str) => {
    if (!str) return str;
    return str.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
};
const BASE_URL = process.env.REACT_APP_API_URL;
const API_URL = `${BASE_URL}/api/events/`;

export function useEvents(currentDate) {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // 🌟 스켈레톤 UI를 위한 로딩 상태

    // ========================================================
    // 1. [가져오기] Range Fetching (현재 달 기준 앞뒤 1달치 데이터만 요청)
    // ========================================================
    const fetchEvents = useCallback(async () => {
        if (!currentDate) return;
        setIsLoading(true); // 🌟 통신 시작 전 로딩 켜기 (스켈레톤 애니메이션 발동)

        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfRange = new Date(year, month - 1, 1);
            const endOfRange = new Date(year, month + 2, 0);

            const url = `${API_URL}?start=${encodeURIComponent(startOfRange.toISOString())}&end=${encodeURIComponent(endOfRange.toISOString())}`;

            const res = await fetch(url);
            const data = await res.json();

            if (Array.isArray(data)) {
                const parsedEvents = data.map(ev => {
                    const startObj = new Date(ev.startAt);
                    const endObj = ev.endAt ? new Date(ev.endAt) : startObj;

                    // 반복 종료일(repeatEndDate)도 로컬 시간표(YYYY-MM-DD)로 변환!
                    // 이걸 안 해주면 폼(EventForm)에서 날짜 입력칸이 망가져서 저장이 씹힙니다.
                    let parsedRepeatEnd = ev.repeatEndDate;
                    if (ev.repeatEndDate) {
                        const rObj = new Date(ev.repeatEndDate);
                        parsedRepeatEnd = `${rObj.getFullYear()}-${String(rObj.getMonth() + 1).padStart(2, '0')}-${String(rObj.getDate()).padStart(2, '0')}`;
                    }

                    return {
                        ...ev,
                        startDate: `${startObj.getFullYear()}-${String(startObj.getMonth() + 1).padStart(2, '0')}-${String(startObj.getDate()).padStart(2, '0')}`,
                        startTime: `${String(startObj.getHours()).padStart(2, '0')}:${String(startObj.getMinutes()).padStart(2, '0')}`,
                        endDate: `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}-${String(endObj.getDate()).padStart(2, '0')}`,
                        endTime: `${String(endObj.getHours()).padStart(2, '0')}:${String(endObj.getMinutes()).padStart(2, '0')}`,
                        repeatEndDate: parsedRepeatEnd // 🌟 깔끔하게 변환된 값 적용
                    };
                });
                setEvents(parsedEvents);
            }
        } catch (err) {
            console.error("DB 불러오기 실패:", err);
            toast.error("일정을 불러오지 못했습니다."); // 🌟 투박한 alert 대신 토스트 알림
        } finally {
            setIsLoading(false); // 🌟 통신이 끝나면 무조건 로딩 끄기
        }
    }, [currentDate]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // DB 저장 공통 래퍼 함수
    const saveToDB = async (eventData, isUpdate = false) => {
        const url = isUpdate ? `${API_URL}/${eventData.id}` : API_URL;
        const method = isUpdate ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'DB 저장 실패');
        }
    };

    // ========================================================
    // 2. [저장하기] 프론트 입력값을 절대 시간(UTC)으로 변환 후 저장
    // ========================================================
    const handleSaveEvent = async (data, mode = 'all', instanceDate = null) => {
        const cleanData = {
            ...data,
            startDate: cleanString(data.startDate),
            endDate: cleanString(data.endDate),
            startTime: cleanString(data.startTime),
            endTime: cleanString(data.endTime),
            repeatEndDate: cleanString(data.repeatEndDate)
        };

        const startDateTime = new Date(`${cleanData.startDate}T${cleanData.startTime || '00:00'}:00`);
        const endDateTime = new Date(`${cleanData.endDate || cleanData.startDate}T${cleanData.endTime || '23:59'}:00`);
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 겹침 검사
        const newStartMs = startDateTime.getTime();
        const newEndMs = endDateTime.getTime();
        const isOverlap = events.some(ev => {
            if (ev.id === cleanData.id || cleanData.isAllDay || ev.isAllDay) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            toast.error('해당 시간대에 이미 겹치는 일정이 있습니다.'); // 🌟 토스트 알림
            return false;
        }

        let repeatEndUTC = null;
        if (cleanData.repeatEndDate) {
            repeatEndUTC = new Date(`${cleanData.repeatEndDate}T23:59:59`).toISOString();
        }

        const payload = {
            ...cleanData,
            startAt: startDateTime.toISOString(),
            endAt: endDateTime.toISOString(),
            timezone: userTimezone,
            repeatEndDate: repeatEndUTC
        };

        const idx = events.findIndex(e => e.id === payload.id);

        try {
            if (idx > -1) {
                if (mode === 'all') {
                    await saveToDB(payload, true);
                } else if (mode === 'single' && instanceDate) {
                    const originalEvent = events[idx];
                    const currentExclusions = originalEvent.excludedDates || [];
                    const updatedOriginalPayload = {
                        ...originalEvent,
                        startAt: new Date(`${originalEvent.startDate}T${originalEvent.startTime || '00:00'}:00`).toISOString(),
                        endAt: new Date(`${originalEvent.endDate || originalEvent.startDate}T${originalEvent.endTime || '23:59'}:00`).toISOString(),
                        excludedDates: [...currentExclusions, instanceDate]
                    };
                    const newStandalonePayload = { ...payload, id: null, repeatUnit: 'none', repeatValue: 1, excludedDates: [], repeatEndDate: null };

                    await saveToDB(updatedOriginalPayload, true);
                    await saveToDB(newStandalonePayload, false);
                }
            } else {
                const newEventPayload = { ...payload, id: null, excludedDates: [] };
                await saveToDB(newEventPayload, false);
            }

            await fetchEvents();
            toast.success('일정이 성공적으로 저장되었습니다!'); // 🌟 성공 토스트 알림
            return true;
        } catch (err) {
            console.error("데이터 저장 중 오류 발생:", err);
            toast.error('일정 저장에 실패했습니다.'); // 🌟 에러 토스트 알림
            return false;
        }
    };

    // ========================================================
    // 3. [삭제하기] 반복 일정 부분 삭제 및 "이 이후 삭제"
    // ========================================================
    const handleDeleteEvent = async (eventId, instanceDate, mode = 'all') => {
        try {
            const targetEv = events.find(e => e.id === eventId);
            if (!targetEv) return;

            let url = `${API_URL}/${eventId}`;
            const targetDate = cleanString(instanceDate);

            if (mode === 'single' && targetDate) {
                url += `?type=single&date=${targetDate}`;
            } else if (mode === 'following' && targetDate) {
                const targetStartObj = new Date(`${targetDate}T${targetEv.startTime || '00:00'}:00`);
                url += `?type=following&targetStartAt=${encodeURIComponent(targetStartObj.toISOString())}`;
            }

            const response = await fetch(url, { method: 'DELETE' });
            if (response.ok) {
                await fetchEvents();
                toast.success('일정이 삭제되었습니다.'); // 🌟 성공 토스트 알림
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || '삭제에 실패했습니다.'); // 🌟 에러 토스트 알림
            }
        } catch (err) {
            console.error("삭제 중 오류 발생:", err);
            toast.error('삭제 중 통신 오류가 발생했습니다.');
        }
    };

    // ========================================================
    // 4. [일괄 삭제] (기본 팝업 제거됨)
    // ========================================================
    const handleDeleteAllOnDate = async (targetDate, eventsToDelete) => {
        if (!eventsToDelete || eventsToDelete.length === 0) return;
        // 🌟 window.confirm 삭제됨 (프론트 UI에서 처리하도록 위임)

        const cleanDate = cleanString(targetDate);

        try {
            const deletePromises = eventsToDelete.map(ev => {
                let url = `${API_URL}/${ev.id}`;
                if (ev.repeatUnit && ev.repeatUnit !== 'none') url += `?type=single&date=${cleanDate}`;
                return fetch(url, { method: 'DELETE' });
            });

            await Promise.all(deletePromises);
            await fetchEvents();
            toast.success(`${targetDate}의 모든 일정이 삭제되었습니다.`);
        } catch (error) {
            console.error("일괄 삭제 에러:", error);
            toast.error("일부 일정 삭제에 실패했습니다.");
        }
    };

    // ========================================================
    // 5. [드래그 앤 드롭 업데이트] 달력에서 끌어다 놨을 때
    // ========================================================
    const handleUpdateEventDate = async (eventId, newDate, newStartTime = null) => {
        const cleanDate = cleanString(newDate);
        const cleanTime = cleanString(newStartTime);

        const targetEv = events.find(e => e.id === eventId);
        if (!targetEv) return;

        if (cleanDate === targetEv.startDate && (!cleanTime || cleanTime === targetEv.startTime)) return;
        if (targetEv.repeatUnit && targetEv.repeatUnit !== 'none') {
            toast.error('반복 일정은 드래그로 이동할 수 없습니다. 클릭해서 수정해주세요.'); // 🌟 토스트 알림
            return;
        }

        const oldStart = new Date(targetEv.startDate);
        const oldEnd = new Date(targetEv.endDate || targetEv.startDate);
        const diffDays = Math.round((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));

        const updatedStart = new Date(cleanDate);
        const updatedEnd = new Date(updatedStart);
        updatedEnd.setDate(updatedEnd.getDate() + diffDays);
        const formattedEnd = `${updatedEnd.getFullYear()}-${String(updatedEnd.getMonth() + 1).padStart(2, '0')}-${String(updatedEnd.getDate()).padStart(2, '0')}`;

        let updatedStartTime = targetEv.startTime || '00:00';
        let updatedEndTime = targetEv.endTime || '23:59';

        if (cleanTime && !targetEv.isAllDay) {
            updatedStartTime = cleanTime;
            const oldStartMins = parseInt(targetEv.startTime.split(':')[0]) * 60 + parseInt(targetEv.startTime.split(':')[1]);
            const oldEndMins = parseInt(targetEv.endTime.split(':')[0]) * 60 + parseInt(targetEv.endTime.split(':')[1]);
            const durationMins = oldEndMins - oldStartMins;

            const newStartMins = parseInt(cleanTime.split(':')[0]) * 60 + parseInt(cleanTime.split(':')[1]);
            const newEndMins = newStartMins + durationMins;

            let newEndHour = Math.floor(newEndMins / 60);
            let newEndMinute = newEndMins % 60;
            if (newEndHour >= 24) { newEndHour = 23; newEndMinute = 59; }
            updatedEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;
        }

        const newStartMs = new Date(`${cleanDate}T${updatedStartTime}:00`).getTime();
        const newEndMs = new Date(`${formattedEnd}T${updatedEndTime}:00`).getTime();
        const isOverlap = events.some(ev => {
            if (ev.id === eventId || targetEv.isAllDay || ev.isAllDay) return false;
            const evStartMs = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`).getTime();
            const evEndMs = new Date(`${ev.endDate || ev.startDate}T${ev.endTime || '23:59'}:00`).getTime();
            return newStartMs < evEndMs && newEndMs > evStartMs;
        });

        if (isOverlap) {
            toast.error('이동하려는 시간대에 이미 겹치는 일정이 있습니다.'); // 🌟 토스트 알림
            return;
        }

        const updatedEvent = {
            ...targetEv, startDate: cleanDate, endDate: formattedEnd, startTime: updatedStartTime, endTime: updatedEndTime
        };

        try {
            await handleSaveEvent(updatedEvent, 'all');
            // handleSaveEvent 내부에서 성공 토스트를 띄우므로 여기선 생략
        } catch (err) {
            console.error("이동 중 오류 발생:", err);
        }
    };

    return { events, isLoading, fetchEvents, handleSaveEvent, handleDeleteEvent, handleUpdateEventDate, handleDeleteAllOnDate };
}