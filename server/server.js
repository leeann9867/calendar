// server/server.js
const app = require('./app'); // 우리가 세팅해둔 app.js를 불러옵니다!

const PORT = 5000;

// 여기서 진짜 서버 문을 엽니다.
app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});