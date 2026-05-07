/* [useHolidays 커스텀 훅]
  연도가 바뀌면 자동으로 서버에서 휴일 정보를 가져옵니다.
*/
// src/hooks/useHolidays.js
import { useState, useEffect } from 'react';

export function useHolidays(year) {
    const [holidays, setHolidays] = useState({});

    useEffect(() => {
        if (!year) return;

        // 백엔드 서버에서 해당 연도의 공휴일 데이터를 가져옵니다.
        fetch(`${process.env.REACT_APP_API_URL}/api/holidays/${year}`)
            .then(res => res.json())
            .then(data => {
                setHolidays(data);
                console.log(`📅 ${year}년 공휴일 연동 완료!`);
            })
            .catch(err => console.error("❌ 공휴일 로딩 실패:", err));
    }, [year]);

    // 날짜(YYYY-MM-DD)를 넣으면 공휴일 이름(예: '설날')을 뱉어주는 마법의 함수
    const getHolidayName = (dateStr) => {
        return holidays[dateStr] || null;
    };

    return { holidays, getHolidayName };
}