const express = require('express');
const book = express.Router(); //ให้ Book เป็น Router

book.get('/list', (req, res) => {
    res.send('hello book list');
})

module.exports = book; //อะไรที่เกี่ยวกับbook จะมาวางไว้ใน bookcontroller