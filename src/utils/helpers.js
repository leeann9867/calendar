/**
 * 프로젝트 전반에서 사용하는 순수 자바스크립트 유틸리티 함수 모음
 */

// 날짜 객체를 YYYY-MM-DD 형식의 문자열로 변환
export const formatDate = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
};

// 로컬스토리지 입출력 관리 객체
export const storage = {
    save: (events) => localStorage.setItem('calendar_events', JSON.stringify(events)),
    load: () => {
        try {
            return JSON.parse(localStorage.getItem('calendar_events')) || [];
        } catch {
            return [];
        }
    }
};

// 시간 자동 조정 (시작 시간 기준 1시간 뒤 종료 시간 계산)
export const getAutoEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};