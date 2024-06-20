const express = require('express');
const app = express();
const bodyParser = require('body-parser'); // import เข้ามาเพื่อสามารถพิมพ์ body เป็น jsonได้

//postgres
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient();

//signIn signOut
const jwt = require('jsonwebtoken') //
const dotenv = require('dotenv')
dotenv.config();//ใส่เพื่ออ่านค่า

const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.use(bodyParser.json());//ส่งค่า body เป็น json
app.use(bodyParser.urlencoded({ extended: true})); //ส่งค่า body มาได้
app.use('/uploads', express.static('uploads'));

//มาจาก bookController
const bookController = require('./controllers/BookControllers');
app.use('/book', bookController)

const cors = require('cors')
app.use(cors());

//middleware
function checkSignIn( req, res, next) { //next คือตรวจสอบว่าผ่านไหม ถ้าผ่านก็เข้าสู่กระบวนการต่อไป
    try {
        const secret = process.env.TOKEN_SECRET;
        const token = req.headers['authorization'];
        const result = jwt.verify(token, secret);

        if (result != undefined) {
            next(); //ถ้า ผลลัพธ์ไม่เท่ากับ ไม่มีค่า ให้ next ต่อ
        } 
    } catch (e) {
        res.status(500).send({ error: e.message})
    }
}

app.get('/user/info', checkSignIn, (req, res, next) => {
    try {
        res.send('hello back office user info ')
    } catch (e) {
        res.status(500).send({ error: e.message})
    }
})

//api
app.get('/', (req, res) => {
    res.send('hello world by express by phop');
})
app.get('/hello/:name', (req, res) => {
    res.send('hello '+ req.params.name);
})
app.get('/hi/:name/:age', (req, res) => {
    const name = req.params.name;
    const age = req.params.age;
    //res.send('name = ' + name + ' age = '+ age)
    res.send(`name = ${name} age = ${age}`);
})
app.post('/hello', (req, res) => { //path ซ้ำได้ แต่ต้องคนละ method
    res.send(req.body);
}) 
app.put('/myPut', (req, res) => {
    res.send(req.body);
})
app.put('/updateCustomer/:id', (req, res) => {
    const id = req.params.id;
    const data = req.body;

    res.send({id: id, data: data}); //ส่งค่า jsonโดยใช้ {} โดยปกติ key value จะชื่อเดียวกัน
})
app.delete('/myDelete/:id', (req, res) => {
    res.send('id = '+ req.params.id);
})

//api with postgres
app.get('/book/list', async (req, res) => {
    const data = await prisma.book.findMany();// select * from "book"
    res.send({data: data});
})
app.post('/book/create', async (req, res) => {
    const data = req.body;
    const result = await prisma.book.create({
        data: data
    }); //INSERT INTO book(isbn, name, price) VALUES(:isbn, :name, :price)

    res.send({ result: result})
})
app.post('/book/createManual', async (req, res) => { //เพิ่มข้อมูลแบบ Manual
    const result = await prisma.book.create({
        data: {
            isbn: "1004",
            name: "Java",
            price: 150
        }
    })

    res.send ({ result: result })
})
app.put('/book/update/:id', async (req, res) => {
    try{
        await prisma.book.update({
            data: { //update dataทั้งหมดใน table
                isbn: '10022',
                name: 'test-update',
                price: 900
            }, 
            where: {
                id: parseInt(req.params.id) //แปลงid ใน database ให้เป็นINT เพราะตอนแรกเป็นString
            }
        })

        res.send({ message: 'success'})
    }catch (e) {
        res.status(500).send({error: e.message});
    }
})
app.delete('/book/remove/:id', async (req, res) => {
    try{
        await prisma.book.delete({
            where:{
                id: parseInt(req.params.id)
            }
        })
        res.send({ message: 'success'}); 
    }catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.post('/book/search', async (req, res) => {
    try{
        const keyword = req.body.keyword;
        const data = await prisma.book.findMany({
            where: {
                name: {
                    contains: keyword // Like ('%keyword%')
                } //เวลาเขียนใน body json จะได้ว่า { "keyword": "ตามด้วยคำที่เราต้องการจะค้น"}
            }
        })

        res.send({ results: data}) //data มาจากบรรทัดที่ 94
    }catch (e) {
        res.status(500).send({ error: e.message });
    }
})
app.post('/book/startsWith', async (req, res) => {
    try{
        const keyword = req.body.keyword;
        const data = await prisma.book.findMany({
            where: {
                name: {
                    startsWith: keyword
                }
            }
        })

        res.send({ results: data })
    }catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.post('/book/endsWith', async (req, res) => {
    try{
        const keyword = req.body.keyword;
        const data = await prisma.book.findMany({
            where: {
                name: {
                    endsWith: keyword
                }
            }
        })

        res.send({ results: data })
    }catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/orderBy', async (req, res) => {
    try{
        const data = await prisma.book.findMany({
            orderBy: {
                price: 'desc' //เรียงราคาจาก มากไปน้อย
            }
        })

        res.send({ results: data })
    }catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/gt', async (req, res)=> { //ค้นหาราคา มากกว่า 900 โดยใช้คำสั่งgt
    try{
        const data = await prisma.book.findMany({
            where: {
                price: {
                    gt: 900 // >500
                }
            }
        })

        res.send({ results: data})
    }catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/lt', async (req, res)=> { //ค้นหาราคา น้อยกว่า 900 โดยใช้คำสั่งlt
    try{
        const data = await prisma.book.findMany({
            where: {
                price: {
                    lt: 900 // >500
                }
            }
        })

        res.send({ results: data})
    }catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/notNull', async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            where: {
                detail: {
                    not: null
                }
            }
        })
        
        res.send({ results: data })
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/isNull', async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            where: {
                detail: null 
            }
        })
        
        res.send({ results: data})
    } catch (e) {
        res.status(500).send({ error: e.message});
    }
})
app.get('/book/between', async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            where: {
                price: {
                    lte: 1500, // lte คือ น้อยกว่าหรือเท่ากับ 
                    gte: 900 // gte คือ มากกว่าหรือเท่ากับ
                }
            }
        })     
        
        res.send({ results: data });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
})
app.get('/book/sum', async (req, res) => {
    try {
        const data = await prisma.book.aggregate({ //method คำนวณตัวเลข
            _sum: { //จำเป็นต้องมี underscore
                price: true //ผลรวมทั้งหมดมาบวกกัน
            }
        })

        res.send({ results: data})
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/max', async (req, res) => {
    try {
        const data = await prisma.book.aggregate({ //method คำนวณตัวเลข
            _max: { //จำเป็นต้องมี underscore
                price: true //ราคาที่สูงที่สุด
            }
        })

        res.send({ results: data})
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/min', async (req, res) => {
    try {
        const data = await prisma.book.aggregate({ //method คำนวณตัวเลข
            _min: { //จำเป็นต้องมี underscore
                price: true //ราคาที่ต่ำที่สุด
            }
        })

        res.send({ results: data})
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/avg', async (req, res) => {
    try {
        const data = await prisma.book.aggregate({ //method คำนวณตัวเลข
            _avg: { //จำเป็นต้องมี underscore
                price: true //ราคาค่าเฉลี่ย
            }
        })

        res.send({ results: data})
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/findYearMonthDay', async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            where: {
                registerDate: {
                    gte: new Date('2024-06-1'),
                    lte: new Date('2024-06-12')
                }
            }
        })

        res.send({ results: data});
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/findYearMonth', async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            where: {
                registerDate: {
                    gte: new Date('2024-06-1'),
                    lte: new Date('2024-06-31')
                }
            }
        })

        res.send({ results: data});
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/book/findYear', async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            where: {
                registerDate: {
                    gte: new Date('2024-01-1'),
                    lte: new Date('2024-12-31')
                }
            }
        })

        res.send({ results: data});
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})

//authentication
app.get('/user/createToken', (req, res)=> {
    try {
        const secret = process.env.TOKEN_SECRET; //key token_secret มาจากไฟล์ .env โดย import ด้วยคำสั่ง dotenv.config()
        const payload = { //payload คือข้อมูลที่เอาไปเข้ารหัส
            id: 100,
            name: "phop",
            level: "admin"
        }
        const token = jwt.sign(payload, secret, { expiresIn: '1d'}) //jwt.sign คือการเอาข้อมูลที่จะเข้ารหัสใส่เข้าไป expiresIn 1d คือวันหมดอายุ เวลาล็อคอิน แค่1วัน
        
        res.send({ results: token})
    } catch (e) {
        res.status(500).send({ error: e.message});
    }
})
app.get('/user/verifyToken', (req, res) => {
    try {
        const secret = process.env.TOKEN_SECRET; //key
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAwLCJuYW1lIjoicGhvcCIsImxldmVsIjoiYWRtaW4iLCJpYXQiOjE3MTgyMDEzMzcsImV4cCI6MTcxODI4NzczN30.kTw37J1tsQF3OH8ILNUQ1u684XMm4lrjP9e7QFTKrbU"
        //รหัส token ที่ถูกถอดมาแล้ว จาก jwt.sign
        const result = jwt.verify(token, secret); //jwt.verify คือการตรวจสอบความถูกตั้ง

        res.send({ result: result});
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
})

//relation
app.get('/oneToOne', async (req, res) => {
    try {
        const data = await prisma.orderDetail.findMany({ //ดึงข้อมูลของ OrderDetailทั้งหมด
            include: { //รวมกับ ตาราง book
                Book: true
            }
        })

        res.send({ result: data })
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
})
app.get('/oneToMany', async (req, res) => {
    try {
        const data = await prisma.book.findMany({
            include: {
                Orderdetail: true
            }
        })

        res.send({ result: data})
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
})
app.get('/multiModel', async (req, res) => {
    try {
        const data = await prisma.customer.findMany({
            include: {
                Order: {
                    include: {
                        OrderDetail: true //เชื่อม3 โมเดล
                    }
                }
            }
        })

        res.send({ result: data})
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
})
app.post('/book/testUpload', (req, res) => {
    try {
        const myFile = req.files.myFile;

        myFile.mv('./uploads' + myFile.name, (err) => {
            if (err) {
                res.status(500).send({ error: err.message })
            }
            res.send({ message: 'success'})
        })
    } catch (e) {
    res.status(500).send({ error: e.message})        
    }
})
app.get('/readFile', (req, res) => {
    try {
        const fs = require('fs'); //filesystem 
        fs.readFile("test.txt", (err, data) => { //อ่านไฟล์ test.txt
            if(err) {
                throw err;
            }

            res.send(data);
        })
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/writeFile', (req, res) => {
    try {
        const fs = require('fs');
        fs.writeFile("test.txt", 'hello by phop', (err, data) => {
            if (err) {
                throw err;
            }

            res.send({ message: 'success'});
        })
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/removeFile', (req, res) => {
    try {
        const fs = require('fs');
        fs.unlinkSync('test.txt')
        res.send({ message: 'delete success' });
    } catch (e) {
        res.status(500).send({ error: e.message })
    }
})
app.get('/fileExitsts', (req, res) => {
    try {
        const fs = require('fs');
        const found = fs.existsSync('package.json');

        res.send({ found: found})
    } catch (e) {
        res.status(500).send({ error: e.message})
    }
})
app.get('/createPdf', (req, res) => {
    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream('output.pdf')); //pipe นำทาง ใส่สกุลไฟล์ให้ชื่อด้วย
    doc
        .font('Kanit')
        .fontSize(25)
        .text('สวัสดีสัส',100 ,100)
    doc
        .addPage()
        .fontSize(25)
        .text('Here is some vector graphics....', 100, 100)
    
        doc.end();

    res.send({ message: 'success'})
}) 
app.get('/readExcel', async (req, res) => {
    try {
        const excel = require('exceljs');
        const wb = new excel.Workbook(); //wb = workbook
        await wb.xlsx.readFile('productExport.xlsx');
        const ws = wb.getWorksheet(1);

        for (let i = 1; i< ws.rowCount; i++) {//excel เริ่มที่1 Array เริ่มที่ 0
            const row = ws.getRow(i);
            const barcode = row.getCell(1).value;
            const name = row.getCell(2).value;
            const cost = row.getCell(3).value;
            const sale = row.getCell(4).value;
            const send = row.getCell(5).value;
            const unit = row.getCell(6).value;
            const point = row.getCell(7).value;
            const productTypeId = row.getCell(8);

            console.log(barcode, name, cost, sale, send, unit, point, productTypeId);
            }
            res.send({ message: 'success'})
    } catch (e) {
        res.status(500).send({ error: e.message});
    }
})
app.listen(3000);