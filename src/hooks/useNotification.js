import { useEffect } from 'react';

export const useNotification = (events) => {
    useEffect(() => {
        const checkSchedule = () => {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

            events.forEach(ev => {
                // 1. 날짜 확인 및 알림 제외 날짜(excludedReminderDates) 체크
                if (ev.date !== todayStr) return;
                if (ev.excludedReminderDates?.includes(todayStr)) return; // 오늘 알림 끄기 설정된 경우 패스

                const [evH, evM] = ev.time.split(':').map(Number);
                const eventTotalMinutes = evH * 60 + evM;

                // 2. 다중 알림 설정(reminders 배열) 순회
                if (Array.isArray(ev.reminders)) {
                    ev.reminders.forEach(offset => {
                        if (currentTotalMinutes === eventTotalMinutes - offset) {
                            new Notification("📅 일정 알림", {
                                body: offset === 0 ? `지금 '${ev.title}' 시작!` : `${offset}분 후 '${ev.title}' 시작!`,
                                tag: `${ev.id}-${offset}-${todayStr}` // 같은 시간에 중복 알림 방지
                            });
                        }
                    });
                }
            });
        };

        const timer = setInterval(checkSchedule, 60000);
        return () => clearInterval(timer);
    }, [events]);
};