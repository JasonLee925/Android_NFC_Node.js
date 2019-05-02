// 引入中介軟體
const express = require('express');

// 創建express中介軟體
const app = express();

// 引入http body 的解析函式庫
const bodyParser = require('body-parser');

// 引入設定資料 config.js
const config = require('./config');

// 將 http body JSON 解析器加入中介軟體(加入後將可自動解析JSON格式的字串)
app.use(bodyParser.json());

// 所有nfc卡片資料
const memoryStore = {};
// 最新一張nfc卡資料
let lastNfcCard;

function isEmpty(obj) {
    // 為null 或 undeifned 則為空值
    if ([null, undefined].indexOf(obj) != -1) return true;

    // 型別如果不是 object 則為空值(這邊將淘汰掉string的型別)
    if (typeof obj !== "object") return true;

    // 判斷object 或 array(算是object)是否有值，如沒有則為空
    for (var key in obj)
        if (obj.hasOwnProperty(key))
            return false;
    return true;
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/html/index.html');
});

app.get('/nfc/uid', (req, res) => {
    res.send(memoryStore);
});

app.get('/nfc/lastuid', (req, res) => {
    res.send(lastNfcCard);
});

//app.get('/nfc/list', (req, res) => {
//	res.status(200).send(memoryStore);
//});
/*
TODO:
1. 新增一個uri路由使用GET名為 /nfc/uid，並且回傳memoryStore 
2. 新增一個uri路由使用GET名為 /nfc/lastuid，並且回傳lastNfcCard
提示1： 使用 app.get(...) 來路由
提示2： 並且使用 res.send(...) 來回傳請求資料 => 這邊的res為express的路由回調函式的第二個引數名稱
*/

app.post('/nfc/uid', (req, res) => {
    // 如果解析為空，回傳狀態碼400(請求錯誤 => bad request)
    if (isEmpty(req.body)) {
        console.log('Bad request');
        return res.sendStatus(400);
    }
    // 匿名函式取得當前時間
    const now = () => new Date(Date.now()).toLocaleString('zh-TW');
    // 4bytes UID正規表達式
    const reg = /^([0-9A-F]{8})$/i;

    // 測試是否符合4bytes UID格式
    if (reg.test(req.body.uid)) {
        // 更新最新的卡號
        lastNfcCard = { uid: req.body.uid };
        // obj['keyName'] = 5 等價於 obj.keyName = 5
        if (!memoryStore[req.body.uid]) {
			//
			memoryStore[req.body.uid] = {
                    "create_time": now(),
                    "update_time": now(),
                    "count"      : 1
                }
				
			lastNfcCard['isNewCard'] = true;
			lastNfcCard['create_time'] = now();
			lastNfcCard['update_time'] = now();
			lastNfcCard['count'] = 1;
        }
        else {
			memoryStore[req.body.uid]['count'] += 1;
			memoryStore[req.body.uid]['update_time'] = now();
			
			lastNfcCard['isNewCard'] = false;
			lastNfcCard['create_time'] = memoryStore[req.body.uid]['create_time'];
			lastNfcCard['update_time'] = memoryStore[req.body.uid]['update_time'];
			lastNfcCard['count'] = memoryStore[req.body.uid]['count'];
        }
		
        // 印出目前Store的資料
        console.log(memoryStore);
        // 回傳OK
        return res.status(200).send(memoryStore);
    }
    else {
        console.log('3');
        // 回傳 Bad Request => UID格式錯誤
        return res.status(400).send({
            message: "UID format error!"
        });
    }
});

// 開始監聽
app.listen(config.serverPort, () => {
    console.log(`The node.js server is running at port ${config.serverPort}`)
});
