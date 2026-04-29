// server/app.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// 미들웨어 세팅
app.use(cors());
app.use(express.json());

// DB 세팅 (기존 코드와 동일)
const db = new sqlite3.Database('./calendar.db', (err) => {
    if (err) console.error('DB 연결 실패:', err);
    else console.log('✅ SQLite 연결 성공!');
});

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT,
      startDate TEXT,
      endDate TEXT,
      isAllDay INTEGER,
      startTime TEXT,
      endTime TEXT,
      reminderValue INTEGER,
      reminderUnit TEXT,
      repeatValue INTEGER,
      repeatUnit TEXT,
      tag TEXT,
      color TEXT,
      memo TEXT,
      excludedDates TEXT,
      repeatEndDate TEXT
    )
  `);
});

// API 라우터 (기존 코드와 동일)
app.get('/api/events', (req, res) => { /* ... */ });
app.post('/api/events', (req, res) => { /* ... */ });
// ... 나머지 PUT, DELETE 라우터 ...

// 🌟 핵심: app.listen()을 하지 않고 모듈로 내보냅니다!
module.exports = app;