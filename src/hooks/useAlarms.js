import { useEffect, useRef } from 'react';

/**
 * [useAlarms Custom Hook]
 * 앱 백그라운드에서 1분마다 현재 시간을 체크하여,
 * 사용자가 설정한 '알림 시간(Reminder)'에 도달한 일정이 있는지 검사하고
 * 브라우저 네이티브 푸시 알림(Notification)을 띄워주는 역할을 전담합니다.
 * @param {Array} events - 전체 일정 데이터 배열
 */
export function useAlarms(events) {
    const notifiedEvents = useRef(new Set());

    useEffect(() => {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const checkAlarms = () => {
            if (Notification.permission !== 'granted') return;

            const now = new Date();
            const nowTime = now.getTime();

            events.forEach(ev => {
                if (!ev.startTime) return;

                let reminderMs = 0;
                const rVal = parseInt(ev.reminderValue, 10) || 0;

                if (ev.reminderUnit === 'm') reminderMs = rVal * 60 * 1000;
                else if (ev.reminderUnit === 'h') reminderMs = rVal * 60 * 60 * 1000;
                else if (ev.reminderUnit === 'd') reminderMs = rVal * 24 * 60 * 60 * 1000;

                if (reminderMs === 0 && rVal === 0) return;

                const targetDate = new Date(`${ev.startDate}T${ev.startTime}:00`);
                const targetTime = targetDate.getTime();
                const alarmTime = targetTime - reminderMs;

                if (nowTime >= alarmTime && nowTime <= alarmTime + 5 * 60 * 1000) {
                    const uniqueEventKey = `${ev.id}-${ev.startDate}`;

                    if (!notifiedEvents.current.has(uniqueEventKey)) {
                        new Notification(`📅 [다가오는 일정] ${ev.title}`, {
                            body: `일정이 ${rVal}${ev.reminderUnit === 'm' ? '분' : ev.reminderUnit === 'h' ? '시간' : '일'} 뒤에 시작됩니다!\n시간: ${ev.startTime}`
                        });
                        notifiedEvents.current.add(uniqueEventKey);
                    }
                }
            });
        };

        const intervalId = setInterval(checkAlarms, 60000);
        checkAlarms();

        return () => clearInterval(intervalId);
    }, [events]);
}