/**
 * "HH:mm" -> 분 단위 변환
 */
const timeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * 두 일정이 시간상으로 겹치는지 체크
 */
export const checkEventConflict = (newEvent, allEvents) => {
    const newStart = timeToMinutes(newEvent.time);
    // 중요: endTime이 없으면 기본적으로 시작 시간 + 1시간(60분)으로 간주하여 범위를 만듭니다.
    const newEnd = newEvent.endTime
        ? timeToMinutes(newEvent.endTime)
        : newStart + 60;

    console.log(`[중복체크] 새 일정: ${newEvent.title} (${newStart}분 ~ ${newEnd}분)`);

    // allEvents가 배열이 아닐 경우를 대비
    if (!Array.isArray(allEvents)) return false;

    const conflict = allEvents.find(ev => {
        // 1. 자기 자신 제외 및 날짜 확인
        if (ev.id === newEvent.id || ev.date !== newEvent.date) return false;

        const existStart = timeToMinutes(ev.time);
        const existEnd = ev.endTime ? timeToMinutes(ev.endTime) : existStart + 60;

        // 2. 겹침 논리 검사
        const isOverlapping = newStart < existEnd && existStart < newEnd;

        if (isOverlapping) {
            console.warn(`🚨 충돌 발생! 기존 일정: ${ev.title} (${existStart}분 ~ ${existEnd}분)`);
        }

        return isOverlapping;
    });

    return !!conflict; // 찾았으면 true, 없으면 false
};