/**
 * @file calendarUtils.js
 * @description 캘린더 전반에서 사용되는 날짜 계산, 정렬, 반복 일정 생성 등의 순수 로직(Pure Functions)을 모아둔 유틸리티 파일입니다.
 */

/**
 * 1. [clearTime]
 * Date 객체에서 시간, 분, 초, 밀리초를 모두 0으로 초기화한 타임스탬프를 반환합니다.
 * 순수하게 '날짜(일)' 단위의 대소 비교를 할 때 필수적으로 사용됩니다.
 * @param {Date} d - 시간을 초기화할 원본 Date 객체
 * @returns {number} 시간 정보가 제거된 00:00:00 기준의 밀리초 타임스탬프
 */
export const clearTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * 2. [getFormatDate]
 * Date 객체를 'YYYY-MM-DD' 형태의 표준 문자열로 포맷팅합니다.
 * 월(Month)과 일(Date)이 한 자리 수일 경우 앞에 '0'을 채워(padStart) 두 자리로 맞춥니다.
 * @param {Date} d - 포맷팅할 Date 객체
 * @returns {string} 'YYYY-MM-DD' 형식의 문자열
 */
export const getFormatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * 3. [sortEvents]
 * 여러 개의 일정 배열을 캘린더 UI 렌더링 순서에 맞게 일괄 정렬합니다.
 * [우선순위: 1. 날짜가 빠른 순 -> 2. 하루 종일(All-day) 일정 우선 -> 3. 시작 시간이 빠른 순]
 * @param {Array} eventList - 정렬할 원본 일정 배열
 * @returns {Array} 3단계 규칙에 의해 정렬된 새로운 일정 배열
 */
export const sortEvents = (eventList) => {
    return [...eventList].sort((a, b) => {
        const dateA = clearTime(new Date(a.startDate));
        const dateB = clearTime(new Date(b.startDate));
        if (dateA !== dateB) return dateA - dateB;

        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;

        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
    });
};

/**
 * 4. [getInstancesForWeek]
 * 화면에 보이는 현재 주(혹은 월간 뷰의 전체 주간 범위) 안에 존재하는 모든 이벤트를 반환합니다.
 * 특히 '반복 일정'의 경우, 원본 일정 1개에서 파생되는 여러 개의 가상 인스턴스(Instance) 복제본을 생성해냅니다.
 * @param {Object} ev - 검사할 단일 이벤트 객체
 * @param {number} weekStart - 현재 화면에 보이는 범위의 시작 날짜 (타임스탬프)
 * @param {number} weekEnd - 현재 화면에 보이는 범위의 종료 날짜 (타임스탬프)
 * @returns {Array} 현재 화면 범위 내에 표시되어야 할 이벤트(인스턴스) 배열
 */
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
            instances.push({
                ...ev,
                originalStartDate: ev.startDate,
                startDate: dateStr,
                endDate: getFormatDate(new Date(d.getTime() + duration)),
                isInstance: true
            });
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }
    return instances;
};

/**
 * 5. [isLastInstance]
 * 반복 일정을 삭제하거나 수정하려 할 때, 이 일정이 반복 사이클의 "유일하게 남은 마지막 1개"인지 판별합니다.
 * @param {Object} initData - 판별할 대상 반복 일정 데이터
 * @returns {boolean} 일정이 단일 일정이거나, 반복 인스턴스가 1개 이하로 남았다면 true
 */
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