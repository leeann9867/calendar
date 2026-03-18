/**
 * 날짜 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 * @param {Date|string} date - 변환할 날짜 데이터
 * @returns {string} YYYY-MM-DD 형식의 문자열
 */
export const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * 브라우저 로컬 스토리지를 이용한 데이터 영속성 관리 객체
 */
export const storage = {
    save: (events) => localStorage.setItem('calendar_events', JSON.stringify(events)),
    load: () => {
        try {
            return JSON.parse(localStorage.getItem('calendar_events')) || [];
        } catch (e) {
            console.error("데이터 로드 실패", e);
            return [];
        }
    }
};

/**
 * 시작 시간을 기준으로 1시간 뒤의 종료 시간을 계산합니다. (24시 포맷)
 * @param {string} startTime - HH:mm 형식의 시작 시간
 * @returns {string} HH:mm 형식의 종료 시간
 */
export const getAutoEndTime = (startTime) => {
    if (!startTime) return "10:00";
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};