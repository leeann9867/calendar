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
                // 1. 알람이 켜져있지 않거나 값이 아예 없으면 패스
                if (!event.isAlarmOn || !event.alarms) return;

                // 🌟 2. 강제 배열 변환
                let parsedAlarms = [];
                if (Array.isArray(event.alarms)) {
                    // 이미 진짜 배열이라면 그대로 사용
                    parsedAlarms = event.alarms;
                } else if (typeof event.alarms === 'string') {
                    // DB에서 문자열("[10, 30]" 또는 "10,30")로 넘어왔다면 파싱해서 배열로 만듦
                    try {
                        parsedAlarms = JSON.parse(event.alarms);
                    } catch (e) {
                        // JSON 파싱 실패 시 콤마로 잘라서 숫자 배열로 변환
                        parsedAlarms = event.alarms.split(',').map(Number);
                    }
                }

                // 변환된 배열이 비어있다면 패스
                if (parsedAlarms.length === 0) return;

                // 3. 알람 시간 계산 로직 시작
                const eventStartTime = new Date(`${event.startDate}T${event.startTime}`);

                parsedAlarms.forEach(alarmMins => {
                    const alarmTime = new Date(eventStartTime.getTime() - alarmMins * 60000);
                    const alarmTimeStr = `${alarmTime.getFullYear()}-${String(alarmTime.getMonth()+1).padStart(2,'0')}-${String(alarmTime.getDate()).padStart(2,'0')} ${String(alarmTime.getHours()).padStart(2,'0')}:${String(alarmTime.getMinutes()).padStart(2,'0')}`;

                    // 알람 시간과 현재 시간이 분 단위까지 일치하면 울림!
                    if (nowTimeStr === alarmTimeStr) {
                        const msg = `[${event.title}] 일정이 ${alarmMins === 0 ? '시작되었습니다!' : `${alarmMins}분 남았습니다!`}`;

                        // 1. 기존 화면 토스트 알림
                        toast.success(msg, { icon: '🔔', duration: 5000 });

                        // 2. OS 네이티브 푸시 알림
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('My Calendar 알림', {
                                body: msg,
                                icon: '/favicon.ico',
                                requireInteraction: true
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