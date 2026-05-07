import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function useAlarms(events) {
    // 🌟 1. 앱 실행 시 브라우저/OS에 알림 권한을 요청합니다.
    useEffect(() => {
        if ('Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        const checkAlarms = () => {
            const now = new Date();
            const nowTimeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

            events.forEach(event => {
                if (!event.isAlarmOn || !event.alarms || event.alarms.length === 0) return;

                // 반복 일정과 단일 일정의 시작 시간(start_at)을 계산하는 로직이 있다고 가정
                // (기존에 구현해두신 일정 시간 비교 로직을 여기에 그대로 쓰시면 됩니다!)
                const eventStartTime = new Date(`${event.startDate}T${event.startTime}`);

                event.alarms.forEach(alarmMins => {
                    const alarmTime = new Date(eventStartTime.getTime() - alarmMins * 60000);
                    const alarmTimeStr = `${alarmTime.getFullYear()}-${String(alarmTime.getMonth()+1).padStart(2,'0')}-${String(alarmTime.getDate()).padStart(2,'0')} ${String(alarmTime.getHours()).padStart(2,'0')}:${String(alarmTime.getMinutes()).padStart(2,'0')}`;

                    // 알람 시간과 현재 시간이 분 단위까지 일치하면 울림!
                    if (nowTimeStr === alarmTimeStr) {
                        const msg = `[${event.title}] 일정이 ${alarmMins === 0 ? '시작되었습니다!' : `${alarmMins}분 남았습니다!`}`;

                        // 1. 기존 화면 토스트 알림
                        toast.success(msg, { icon: '🔔', duration: 5000 });

                        // 🌟 2. OS 네이티브 푸시 알림 (브라우저 밖에서도 보임!)
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('My Calendar 알림', {
                                body: msg,
                                icon: '/favicon.ico', // public 폴더에 아이콘이 있다면 적용됩니다
                                requireInteraction: true // 사용자가 닫기 전까지 알림 유지
                            });
                        }
                    }
                });
            });
        };

        const timer = setInterval(checkAlarms, 60000); // 1분마다 체크
        return () => clearInterval(timer);
    }, [events]);
}