import { useState, useMemo } from 'react';

// default 키워드를 제거하여 { useCalendar }로 불러올 수 있게 수정
export function useCalendar(initialEvents = []) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState(initialEvents);

    // 1. 달력 날짜 계산 로직 (6주 고정 42칸)
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDay = firstDayOfMonth.getDay();
        const days = [];

        const prevLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevLastDay - i),
                isCurrentMonth: false,
            });
        }

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true,
            });
        }

        const remainingSlots = 42 - days.length;
        for (let i = 1; i <= remainingSlots; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
            });
        }

        return days;
    }, [currentDate]);

    // 2. 일정 렌더링 판별 (반복 및 무기한 반복 대응)
    const getEventsForDate = (date) => {
        // 로컬 시간 기준으로 YYYY-MM-DD 생성 (ISO T00:00 방지)
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const dayOfWeek = date.getDay();

        return events.filter((event) => {
            const startStr = event.date;
            const untilStr = event.until;

            // 시작일 이전엔 무조건 제외
            if (dateStr < startStr) return false;

            // 종료일(until)이 있고, 현재 날짜가 종료일을 넘었으면 제외
            if (untilStr && dateStr > untilStr) return false;

            // 반복 유형별 필터링
            if (!event.repeat || event.repeat === 'none') {
                return dateStr === startStr;
            }

            if (event.repeat === 'daily') return true;

            if (event.repeat === 'weekly') {
                const startDay = new Date(startStr).getDay();
                return dayOfWeek === startDay;
            }

            if (event.repeat === 'monthly') {
                const startDateNum = new Date(startStr).getDate();
                return date.getDate() === startDateNum;
            }

            if (event.repeat === 'yearly') {
                const startObj = new Date(startStr);
                return (
                    date.getMonth() === startObj.getMonth() &&
                    date.getDate() === startObj.getDate()
                );
            }

            return false;
        });
    };

    // 3. 핸들러
    const addEvent = (newEvent) => {
        const id = Date.now();
        setEvents((prev) => [...prev, { ...newEvent, id }]);
    };

    const updateEvent = (updatedEvent) => {
        setEvents((prev) =>
            prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
        );
    };

    const deleteEvent = (id) => {
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    const goToday = () => setCurrentDate(new Date());

    return {
        currentDate,
        calendarData,
        events,
        getEventsForDate,
        addEvent,
        updateEvent,
        deleteEvent,
        prevMonth,
        nextMonth,
        goToday,
    };
}