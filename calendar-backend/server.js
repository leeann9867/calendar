// server.js

// 1. 필요한 도구(라이브러리)들을 가져옵니다.
const express = require('express');   // 서버를 만드는 도구
const cors = require('cors');         // 프론트엔드 접속을 허락해주는 도구
const sqlite3 = require('sqlite3').verbose(); // SQLite DB 도구 (verbose를 붙이면 오류를 더 자세히 알려줍니다)

const app = express(); // 익스프레스 서버 객체 생성
const PORT = 5000;     // 서버를 열 포트 번호 (리액트는 보통 3000, 서버는 5000을 씁니다)

// 2. 서버 설정 (미들웨어)
app.use(cors()); // 리액트 앱이 이 서버에 데이터를 요청할 수 있도록 허락합니다.
app.use(express.json()); // 리액트가 보낸 JSON 형태의 데이터를 서버가 읽을 수 있도록 변환해 줍니다.

// 3. SQLite 데이터베이스 연결 및 테이블 생성
// './calendar.db' 라는 파일에 데이터를 저장합니다. 파일이 없으면 자동으로 만들어집니다!
const db = new sqlite3.Database('./calendar.db', (err) => {
    if (err) console.error('DB 연결 실패:', err.message);
    else console.log('✅ SQLite 데이터베이스 연결 성공!');
});

// DB 안에 일정을 저장할 '방(Table)'을 만듭니다. (엑셀의 시트라고 생각하시면 됩니다)
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,             -- 일정 고유 ID (절대 겹치지 않는 값)
      title TEXT,                      -- 일정 제목
      startDate TEXT,                  -- 시작 날짜
      endDate TEXT,                    -- 종료 날짜
      isAllDay INTEGER,                -- 하루 종일 여부 (SQLite는 불리언 대신 0과 1 사용)
      startTime TEXT,                  -- 시작 시간
      endTime TEXT,                    -- 종료 시간
      reminderValue INTEGER,           -- 알림 숫자
      reminderUnit TEXT,               -- 알림 단위 (m, h, d)
      repeatValue INTEGER,             -- 반복 숫자
      repeatUnit TEXT,                 -- 반복 단위 (none, day, week 등)
      tag TEXT,                        -- 태그
      color TEXT,                      -- 색상
      memo TEXT,                       -- 메모
      excludedDates TEXT,              -- 예외 날짜 (배열을 문자열로 변환해서 저장)
      repeatEndDate TEXT               -- 반복 종료 날짜
    )
  `);
});


// =========================================================================
// 4. API 라우터 (프론트엔드와 통신하는 창구)
// =========================================================================

/**
 * [GET] 모든 일정 불러오기 (Read)
 * 리액트 앱이 켜질 때 이 주소로 데이터를 요청합니다.
 */
app.get('/api/events', (req, res) => {
    // events 테이블의 모든(*) 데이터를 가져와라(SELECT)
    db.all(`SELECT * FROM events`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // DB에서 꺼낸 데이터 중 문자열로 저장된 배열/불리언 값을 리액트가 쓰기 좋게 다시 변환해 줍니다.
        const formattedRows = rows.map(row => ({
            ...row,
            isAllDay: row.isAllDay === 1, // 1이면 true, 0이면 false
            excludedDates: row.excludedDates ? JSON.parse(row.excludedDates) : [] // 문자열 -> 배열
        }));

        res.json(formattedRows); // 리액트로 데이터 발사!
    });
});

/**
 * [POST] 새 일정 저장하기 (Create)
 * 리액트에서 일정을 저장하면 이 주소로 데이터가 날아옵니다.
 */
app.post('/api/events', (req, res) => {
    const data = req.body; // 리액트가 보낸 데이터

    // DB에 데이터를 끼워 넣는 SQL 명령어 (보안을 위해 값 들어갈 자리를 '?'로 비워둡니다)
    const sql = `
    INSERT INTO events 
    (id, title, startDate, endDate, isAllDay, startTime, endTime, reminderValue, reminderUnit, repeatValue, repeatUnit, tag, color, memo, excludedDates, repeatEndDate) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    // '?' 자리에 들어갈 진짜 값들의 배열
    const params = [
        data.id, data.title, data.startDate, data.endDate, data.isAllDay ? 1 : 0,
        data.startTime, data.endTime, data.reminderValue, data.reminderUnit,
        data.repeatValue, data.repeatUnit, data.tag, data.color, data.memo,
        JSON.stringify(data.excludedDates || []), data.repeatEndDate
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ 일정 저장 성공!' });
    });
});

/**
 * [PUT] 기존 일정 수정하기 (Update)
 */
app.put('/api/events/:id', (req, res) => {
    const data = req.body;
    const id = req.params.id; // URL 주소 끝에 달고 온 id 값

    const sql = `
    UPDATE events SET 
      title = ?, startDate = ?, endDate = ?, isAllDay = ?, startTime = ?, endTime = ?, 
      reminderValue = ?, reminderUnit = ?, repeatValue = ?, repeatUnit = ?, 
      tag = ?, color = ?, memo = ?, excludedDates = ?, repeatEndDate = ?
    WHERE id = ?
  `;

    const params = [
        data.title, data.startDate, data.endDate, data.isAllDay ? 1 : 0,
        data.startTime, data.endTime, data.reminderValue, data.reminderUnit,
        data.repeatValue, data.repeatUnit, data.tag, data.color, data.memo,
        JSON.stringify(data.excludedDates || []), data.repeatEndDate, id // 마지막 '?'는 WHERE id = ? 에 들어감
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ 일정 수정 성공!' });
    });
});

/**
 * [DELETE] 일정 삭제하기 (Delete)
 */
app.delete('/api/events/:id', (req, res) => {
    const id = req.params.id;
    // id가 일치하는 데이터를 지워라(DELETE)
    db.run(`DELETE FROM events WHERE id = ?`, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ 일정 삭제 성공!' });
    });
});

// 5. 서버 가동
app.listen(PORT, () => {
    console.log(`🚀 캘린더 백엔드 서버가 http://localhost:${PORT} 에서 돌아가고 있습니다!`);
});