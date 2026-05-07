// server/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios'); // 🌟 공공 API 호출을 위한 패키지 추가

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use((req, res, next) => {
    console.log(`👀 [API 요청] ${req.method} ${req.url}`);
    next();
});

const isValidUUID = (id) => {
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// ========================================================
// 🌟 [신규] 공공데이터포털 공휴일 API 연동 및 캐싱 로직
// ========================================================
const holidayCache = {}; // 한 번 불러온 연도의 공휴일을 서버 메모리에 기억해두는 바구니

app.get('/api/holidays/:year', async (req, res) => {
    const { year } = req.params;

    // 1. 서버 메모리에 이미 긁어온 데이터가 있다면 0.01초 만에 바로 반환 (속도 최적화)
    if (holidayCache[year]) {
        return res.json(holidayCache[year]);
    }

    // 2. 캐시에 없으면 공공데이터 API 호출 (.env 파일에 HOLIDAY_API_KEY 저장 필수!)
    const SERVICE_KEY = process.env.HOLIDAY_API_KEY;
    if (!SERVICE_KEY) {
        console.log("⚠️ HOLIDAY_API_KEY가 없습니다. 빈 데이터를 반환합니다.");
        return res.json({});
    }

    const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo`;

    try {
        const response = await axios.get(url, {
            params: {
                solYear: year,
                numOfRows: 100, // 1년치 공휴일을 다 가져오기 위해 100개로 넉넉히 설정
                ServiceKey: SERVICE_KEY,
                _type: 'json'
            }
        });

        const items = response.data?.response?.body?.items?.item;
        let holidays = {};

        if (items) {
            // 항목이 1개면 객체, 여러 개면 배열로 오기 때문에 배열로 강제 통일
            const itemArray = Array.isArray(items) ? items : [items];

            itemArray.forEach(item => {
                const dateStr = String(item.locdate); // "20260505"
                // 프론트엔드에서 쓰기 편하게 "YYYY-MM-DD" 형태로 변환
                const formattedDate = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
                holidays[formattedDate] = item.dateName; // { "2026-05-05": "어린이날" }
            });
        }

        // 다음에 똑같은 연도 요청이 오면 바로 주도록 캐시에 저장
        holidayCache[year] = holidays;
        res.json(holidays);

    } catch (err) {
        console.error('🚨 공휴일 API 호출 에러:', err.message);
        res.status(500).json({ error: "공휴일 데이터를 가져오는 데 실패했습니다." });
    }
});

// ========================================================
// [GET] /api/events (기존 일정 조회 로직 복구)
// ========================================================
app.get('/api/events', async (req, res) => {
    try {
        const { start, end } = req.query;
        let eventsQuery = `
          SELECT 
            e.id, e.title, e.start_at AS "startAt", e.end_at AS "endAt", e.timezone,              
            d.is_all_day AS "isAllDay", d.tag, d.color, d.memo, 
            d.is_alarm_on AS "isAlarmOn", d.alarms, 
            d.repeat_value AS "repeatValue", d.repeat_unit AS "repeatUnit", d.repeat_end_date AS "repeatEndDate"
          FROM events e
          LEFT JOIN event_details d ON e.id = d.event_id
        `;

        let queryValues = [];
        if (start && end) {
            eventsQuery += `
                WHERE e.start_at <= $2::TIMESTAMPTZ 
                AND (
                  (d.repeat_unit = 'none' AND e.end_at >= $1::TIMESTAMPTZ)
                  OR 
                  (d.repeat_unit != 'none' AND (d.repeat_end_date IS NULL OR d.repeat_end_date >= $1::TIMESTAMPTZ))
                )
            `;
            queryValues = [start, end];
        }

        const { rows: events } = await pool.query(eventsQuery, queryValues);
        const exceptionsQuery = `SELECT event_id, TO_CHAR(excluded_date, 'YYYY-MM-DD') AS excluded_date FROM event_exceptions`;
        const { rows: exceptions } = await pool.query(exceptionsQuery);

        const formattedEvents = events.map(row => {
            const myExceptions = exceptions.filter(ex => ex.event_id === row.id).map(ex => ex.excluded_date);
            return {
                ...row,
                isAllDay: row.isAllDay === true,
                isAlarmOn: row.isAlarmOn === true,
                excludedDates: myExceptions
            };
        });

        res.json(formattedEvents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================================================
// [POST] /api/events (기존 일정 생성 로직 복구)
// ========================================================
app.post('/api/events', async (req, res) => {
    const data = req.body;
    const safeId = isValidUUID(data.id) ? data.id : null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const eventRes = await client.query(
            `INSERT INTO events (id, title, start_at, end_at, timezone) VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5) RETURNING id`,
            [safeId, data.title, data.startAt, data.endAt, data.timezone]
        );
        const newId = eventRes.rows[0].id;

        await client.query(
            `INSERT INTO event_details (event_id, is_all_day, tag, color, memo, is_alarm_on, alarms, repeat_value, repeat_unit, repeat_end_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [newId, data.isAllDay || false, data.tag, data.color, data.memo, data.isAlarmOn !== false, data.alarms || '10', data.repeatValue, data.repeatUnit, data.repeatEndDate]
        );

        if (data.excludedDates && data.excludedDates.length > 0) {
            for (const date of data.excludedDates) {
                await client.query(`INSERT INTO event_exceptions (event_id, excluded_date) VALUES ($1, $2)`, [newId, date]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: "✅ 저장 성공!", id: newId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: "저장 실패" });
    } finally {
        client.release();
    }
});

// ========================================================
// [PUT] & [DELETE] (기존 수정/삭제 로직 복구)
// ========================================================
app.put('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    if (!isValidUUID(id)) return res.status(400).json({ error: "유효하지 않은 일정 ID" });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`UPDATE events SET title = $1, start_at = $2, end_at = $3, timezone = $4 WHERE id = $5`, [data.title, data.startAt, data.endAt, data.timezone, id]);
        await client.query(
            `UPDATE event_details SET is_all_day = $1, tag = $2, color = $3, memo = $4, is_alarm_on = $5, alarms = $6, repeat_value = $7, repeat_unit = $8, repeat_end_date = $9 WHERE event_id = $10`,
            [data.isAllDay || false, data.tag, data.color, data.memo, data.isAlarmOn !== false, data.alarms || '', data.repeatValue, data.repeatUnit, data.repeatEndDate, id]
        );
        await client.query(`DELETE FROM event_exceptions WHERE event_id = $1`, [id]);
        if (data.excludedDates && data.excludedDates.length > 0) {
            for (const date of data.excludedDates) {
                await client.query(`INSERT INTO event_exceptions (event_id, excluded_date) VALUES ($1, $2)`, [id, date]);
            }
        }
        await client.query('COMMIT');
        res.json({ message: "✅ 수정 성공!" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: "수정 실패" });
    } finally {
        client.release();
    }
});

app.delete('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    const { type, date, targetStartAt } = req.query;
    if (!isValidUUID(id)) return res.status(400).json({ error: "유효하지 않은 ID" });
    try {
        if (type === 'single' && date) {
            await pool.query(`INSERT INTO event_exceptions (event_id, excluded_date) VALUES ($1, $2)`, [id, date]);
            res.json({ message: `✅ 예외 처리 완료` });
        } else if (type === 'following' && targetStartAt) {
            await pool.query(`UPDATE event_details SET repeat_end_date = ($2::TIMESTAMPTZ - INTERVAL '1 second') WHERE event_id = $1`, [id, targetStartAt]);
            res.json({ message: `✅ 이후 일정 삭제 완료` });
        } else {
            await pool.query('DELETE FROM events WHERE id = $1', [id]);
            res.json({ message: '✅ 모든 일정 삭제 완료' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;