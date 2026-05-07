/**
 * [clearTime]
 * Date 객체의 '시간' 부분을 자정(00:00:00.000)으로 초기화하여 타임스탬프(숫자)로 반환합니다.
 * 날짜 비교(예: 오늘인지, 특정 주에 포함되는지)를 할 때 밀리초 단위의 오차를 없애기 위해 필수적으로 사용됩니다.
 */
export const clearTime = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // 시, 분, 초, 밀리초를 모두 0으로 초기화
    return d.getTime(); // 비교하기 쉽도록 1970년 기준 밀리초 숫자로 반환[cite: 5]
};

/**
 * [getFormatDate]
 * Date 객체를 받아서 프론트엔드 UI용 "YYYY-MM-DD" 형태의 문자열로 변환합니다.[cite: 5]
 * 1월~9월이나 1일~9일 앞에는 '0'을 붙여주는(padStart) 처리가 포함되어 있습니다.[cite: 5]
 */
export const getFormatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * [sortEvents]
 * 이벤트 배열을 달력 화면에 렌더링하기 직전에 정렬합니다.[cite: 5]
 * 1순위: 하루종일(All-day) 일정이 최상단[cite: 5]
 * 2순위: 시작 날짜가 빠른 순[cite: 5]
 * 3순위: 시작 시간(HH:MM)이 이른 순[cite: 5]
 */
export const sortEvents = (events) => {
    return events.sort((a, b) => {
        // 1. 하루 종일 여부 비교[cite: 5]
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;

        // 2. 날짜 비교[cite: 5]
        if (a.startDate !== b.startDate) return new Date(a.startDate) - new Date(b.startDate);

        // 3. 시간 비교 (문자열 알파벳 순서 비교 메서드 localeCompare 사용)[cite: 5]
        const aTime = a.startTime || '00:00';
        const bTime = b.startTime || '00:00';
        return aTime.localeCompare(bTime);
    });
};

/**
 * [isLastInstance] 🌟 (추가됨)
 * 현재 선택한 인스턴스가 반복 일정의 마지막 인스턴스인지 확인합니다.
 * "이후 삭제" 로직에서 현재 일정이 마지막이라면 '전체 삭제'와 동일하게 처리하도록 유도합니다.
 */
export const isLastInstance = (ev, instanceDateStr) => {
    // 1. 반복 일정이 아니면 그 자체로 처음이자 마지막입니다.
    if (!ev.repeatUnit || ev.repeatUnit === 'none') return true;

    // 2. 반복 종료일이 없다면 무한 반복이므로 '마지막'이 존재하지 않습니다.
    if (!ev.repeatEndDate) return false;

    // 3. 현재 인스청스 날짜와 반복 종료일(repeatEndDate)을 비교합니다.
    const currentMs = clearTime(new Date(instanceDateStr));
    const endMs = clearTime(new Date(ev.repeatEndDate));

    // 현재 날짜가 반복 종료일과 같거나 그 이후라면 마지막 인스턴스로 간주합니다.
    return currentMs >= endMs;
};

/**
 * [getInstancesForWeek] 🌟 (글로벌 타임존 대응 핵심 엔진)
 * 원본 이벤트 하나를 받아, 현재 사용자가 보고 있는 달력 화면 범위(viewStartMs ~ viewEndMs) 안에
 * 존재해야 할 모든 '반복 일정의 가상 복제본(Instance)'들을 계산하여 배열로 반환합니다.[cite: 5]
 */
export const getInstancesForWeek = (ev, viewStartMs, viewEndMs) => {

    // 1. 반복 일정이 아닌 단순 일정 처리[cite: 5]
    if (!ev.repeatUnit || ev.repeatUnit === 'none') {
        // 단일 삭제(Exception) 처리한 날짜라면 빈 배열 반환하여 숨김[cite: 5]
        if (ev.excludedDates && ev.excludedDates.includes(ev.startDate)) return [];
        return [ev];
    }

    const instances = [];

    // 🌟 [타임존 방어 로직]
    // 문자열 연산 대신 JS Date 객체를 사용하여 날짜를 더합니다.[cite: 5]
    // 이를 통해 윤년, 월별 일수 차이, 서머타임(DST) 오차를 브라우저 엔진이 자동으로 보정합니다.[cite: 5]
    let currentLocalObj = new Date(`${ev.startDate}T${ev.startTime || '00:00'}:00`);

    // 반복 종료 한계선 설정 (없으면 2099년까지 무한히 보여줌)[cite: 5]
    const repeatEndObj = ev.repeatEndDate ? new Date(ev.repeatEndDate) : new Date('2099-12-31');
    const repeatEndLimitMs = clearTime(repeatEndObj);

    let emergencyBreak = 0; // 무한 루프 방지용 안전 장치[cite: 5]

    // 달력 화면 끝(viewEndMs)을 넘을 때까지 인스턴스 생성[cite: 5]
    while (clearTime(currentLocalObj) <= viewEndMs) {
        emergencyBreak++;
        if (emergencyBreak > 500) break; //[cite: 5]

        const currentInstanceDateStr = getFormatDate(currentLocalObj);
        const currentInstanceClearMs = clearTime(currentLocalObj);

        // 렌더링 조건 체크: 범위 내 존재 && 종료일 이전 && 예외(삭제) 날짜 아님[cite: 5]
        if (currentInstanceClearMs >= viewStartMs &&
            currentInstanceClearMs <= repeatEndLimitMs &&
            (!ev.excludedDates || !ev.excludedDates.includes(currentInstanceDateStr)))
        {
            instances.push({
                ...ev,
                id: ev.id, // 부모 ID 유지[cite: 5]
                startDate: currentInstanceDateStr,
                // 기간(Diff) 유지하며 종료일 계산[cite: 5]
                endDate: ev.endDate
                    ? getFormatDate(new Date(currentInstanceClearMs + (clearTime(new Date(ev.endDate)) - clearTime(new Date(ev.startDate)))))
                    : currentInstanceDateStr
            });
        }

        // 반복 주기(val)만큼 날짜 점프[cite: 5]
        const val = parseInt(ev.repeatValue) || 1;

        if (ev.repeatUnit === 'daily') {
            currentLocalObj.setDate(currentLocalObj.getDate() + val);
        } else if (ev.repeatUnit === 'weekly') {
            currentLocalObj.setDate(currentLocalObj.getDate() + (val * 7));
        } else if (ev.repeatUnit === 'monthly') {
            currentLocalObj.setMonth(currentLocalObj.getMonth() + val);
        } else if (ev.repeatUnit === 'yearly') {
            currentLocalObj.setFullYear(currentLocalObj.getFullYear() + val);
        } else {
            break;
        }
    }

    return instances;
};