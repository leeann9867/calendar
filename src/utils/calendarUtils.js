export const clearTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const getFormatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 🌟 [핵심] 모든 달력/위젯에 공통 적용될 완벽한 정렬 함수
export const sortEvents = (eventList) => {
    return [...eventList].sort((a, b) => {
        // 1. 날짜순
        const dateA = clearTime(new Date(a.startDate));
        const dateB = clearTime(new Date(b.startDate));
        if (dateA !== dateB) return dateA - dateB;

        // 2. 하루 종일 일정 최우선
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;

        // 3. 시간순
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
    });
};

export const getInstancesForWeek = (ev, weekStart, weekEnd) => {
    const instances = [];
    const evStart = new Date(ev.startDate);
    const evEnd = new Date(ev.endDate || ev.startDate);
    const duration = evEnd.getTime() - evStart.getTime();
    const interval = parseInt(ev.repeatValue, 10) || 1;
    const exclusions = ev.excludedDates || [];
    const repeatEndDate = ev.repeatEndDate ? clearTime(new Date(ev.repeatEndDate)) : null;

    if (!ev.repeatUnit || ev.repeatUnit === 'none') {
        if (clearTime(evStart) <= weekEnd && clearTime(evEnd) >= weekStart) instances.push(ev);
        return instances;
    }

    let checkDate = new Date(weekStart);
    while (checkDate.getTime() <= weekEnd) {
        const d = checkDate;
        const s = evStart;
        const dateStr = getFormatDate(d);

        if (clearTime(d) < clearTime(s)) { checkDate.setDate(checkDate.getDate() + 1); continue; }
        if (repeatEndDate && clearTime(d) > repeatEndDate) break;
        if (exclusions.includes(dateStr)) { checkDate.setDate(checkDate.getDate() + 1); continue; }

        let isMatch = false;
        const diffDays = Math.round((clearTime(d) - clearTime(s)) / 86400000);

        if (ev.repeatUnit === 'day') {
            if (diffDays % interval === 0) isMatch = true;
        } else if (ev.repeatUnit === 'week') {
            if (d.getDay() === s.getDay() && (diffDays / 7) % interval === 0) isMatch = true;
        } else if (ev.repeatUnit === 'month') {
            const diffMonths = (d.getFullYear() - s.getFullYear()) * 12 + (d.getMonth() - s.getMonth());
            if (d.getDate() === s.getDate() && diffMonths >= 0 && diffMonths % interval === 0) isMatch = true;
        } else if (ev.repeatUnit === 'year') {
            const diffYears = d.getFullYear() - s.getFullYear();
            if (d.getMonth() === s.getMonth() && d.getDate() === s.getDate() && diffYears >= 0 && diffYears % interval === 0) isMatch = true;
        }

        if (isMatch) {
            instances.push({ ...ev, originalStartDate: ev.startDate, startDate: dateStr, endDate: getFormatDate(new Date(d.getTime() + duration)), isInstance: true });
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }
    return instances;
};

export const isLastInstance = (initData) => {
    if (!initData || !initData.repeatUnit || initData.repeatUnit === 'none') return true;
    const s = new Date(initData.originalStartDate || initData.startDate);
    const exclusions = initData.excludedDates || [];
    const repeatEnd = initData.repeatEndDate ? new Date(initData.repeatEndDate).getTime() : new Date('2099-12-31').getTime();
    const interval = parseInt(initData.repeatValue, 10) || 1;

    let count = 0;
    let current = new Date(s);
    let loopLimit = 0;

    while (current.getTime() <= repeatEnd && count < 2 && loopLimit < 1000) {
        loopLimit++;
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        if (!exclusions.includes(dateStr)) count++;

        if (initData.repeatUnit === 'day') current.setDate(current.getDate() + interval);
        else if (initData.repeatUnit === 'week') current.setDate(current.getDate() + interval * 7);
        else if (initData.repeatUnit === 'month') current.setMonth(current.getMonth() + interval);
        else if (initData.repeatUnit === 'year') current.setFullYear(current.getFullYear() + interval);
        else break;
    }
    return count <= 1;
};