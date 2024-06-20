const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead (200, {'Content-Type': 'text/plain'}); //Content Type รูปแบบเนื้อหา 
    /*Method ใช้สำหรับสร้างข้อมูล Header ของ HTTP Response เพื่อส่งกลับไปยัง Client*/
    res.end('Hello world'); //ข้อความจบ
});

server.listen(3000, '127.0.0.1', () => {
    console.log('Listening on 127.0.0.1:3000');
}) //ip ของเครื่องตัวเองคือ 127.0.0.1