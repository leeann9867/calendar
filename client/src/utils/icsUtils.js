import { getFormatDate } from './calendarUtils';

// 🌟 1. 내 일정들을 .ics 파일로 다운로드 (내보내기)
export const exportToICS = (events) => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Calendar App//KO\nCALSCALE:GREGORIAN\n";

    events.forEach(ev => {
        const start = ev.startDate.replace(/-/g, '') + (ev.isAllDay ? '' : `T${ev.startTime.replace(/:/g, '')}00`);
        const end = ev.endDate.replace(/-/g, '') + (ev.isAllDay ? '' : `T${ev.endTime.replace(/:/g, '')}00`);

        icsContent += "BEGIN:VEVENT\n";
        icsContent += `UID:${ev.id}\n`;
        icsContent += `SUMMARY:${ev.title}\n`;
        icsContent += `DTSTART${ev.isAllDay ? ';VALUE=DATE:' : ':'}${start}\n`;
        icsContent += `DTEND${ev.isAllDay ? ';VALUE=DATE:' : ':'}${end}\n`;
        if (ev.memo) icsContent += `DESCRIPTION:${ev.memo.replace(/\n/g, '\\n')}\n`;
        icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `my_calendar_${getFormatDate(new Date())}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// 🌟 2. .ics 파일 읽어서 객체로 변환 (가져오기)
export const importFromICS = (file, onSaveCallback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const events = [];
        const lines = content.split(/\r?\n/);

        let currentEvent = null;
        lines.forEach(line => {
            if (line.startsWith('BEGIN:VEVENT')) currentEvent = { isAllDay: false, repeatUnit: 'none' };
            else if (line.startsWith('SUMMARY:')) currentEvent.title = line.substring(8);
            else if (line.startsWith('DESCRIPTION:')) currentEvent.memo = line.substring(12).replace(/\\n/g, '\n');
            else if (line.startsWith('DTSTART')) {
                const dateStr = line.split(':')[1];
                currentEvent.startDate = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
                if (dateStr.includes('T')) currentEvent.startTime = `${dateStr.slice(9,11)}:${dateStr.slice(11,13)}`;
                else currentEvent.isAllDay = true;
            }
            else if (line.startsWith('DTEND')) {
                const dateStr = line.split(':')[1];
                currentEvent.endDate = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
                if (dateStr.includes('T')) currentEvent.endTime = `${dateStr.slice(9,11)}:${dateStr.slice(11,13)}`;
            }
            else if (line.startsWith('END:VEVENT')) {
                if(currentEvent.title && currentEvent.startDate) events.push(currentEvent);
                currentEvent = null;
            }
        });

        // 파싱된 이벤트들을 순회하며 DB에 저장
        events.forEach(ev => onSaveCallback(ev, 'all'));
        alert(`${events.length}개의 일정을 성공적으로 불러왔습니다!`);
    };
    reader.readAsText(file);
};