var express = require('express');
const models = require('../models');
var router = express.Router();
const decode = require('../module/decode')


// 포스트맨으로 데이터 던질때 이용
router.post('/create', function (req, res, next) {
    let body = req.body;
    models.Alarm.create({
        status: '1',
        socketId: body.socketId,
        UserId: body.UserId,
    })
        .then(result => {
            res.send(JSON.stringify(result));
        })
        .catch(err => {
            var error = JSON.stringify(err);
            error = JSON.parse(error);

            if (error.name == "SequelizeUniqueConstraintError") {
                res.send("wallet 주소 중복 에러!!!");
            } else if (error.name == "SequelizeForeignKeyConstraintError") {
                res.send("외래키 제약 에러!!!");
            }
        })
});


router.get('/data', function (req, res) {
    const user = decode.decode(req)
    models.Alarm.findAll({
        where: {
            UserId: user.id,
            status: '1'
        },
        order: [
            ['createdAt', 'DESC' ]
        ]
    }).then((data) => {
       
        if (data.length <= 0) {
            res.status(404).send('Alarm data is not exist');
        } else {
            res.json(data)
        }
    }).catch((e) => {
        res.status(401).send(e)
    })
});


router.get('/list', function (req, res) {
    const user = decode.decode(req)
    var query = 'SElECT A.selltoken as selltoken,A.buytoken as buytoken ,A.status as status,A.selltokenamount as selltokenamount,A.buytokenamount as buytokenamount,B.createdAt as createdAt FROM test.TBoards as A ,test.Alarms as B where(A.id = B.tableId) and B.UserId = :Id and A.status!=2 order by B.createdAt DESC;'
     
    var values = {
        Id: user.id
    }
    models.sequelize.query(query, { replacements: values }).spread((results, metadata) => {
        res.json(results)
    }, (err) => {
        res.status(404).send(err);
    })
})

router.post('/update', function (req, res) {
    models.Alarm.update({
        stautus: '2'
    }, {
        where: {
            tableId: req.body.TableID,
        }
    }).then(result => {
        console.log("상태 변경완료");

    })
})

router.post('/delete', function (req, res) {
    models.Alarm.destroy({
        where: {
            tableId: req.body.TableID,
        }
    }).then(result => {
        console.log("삭제 완료");
        console.log("취소되었다요")
    })
})

// 버튼 누를시 동작
function create(socketId, UserId, tableId) {
    console.log("alarm creat@@@@###: ", UserId);
    models.Alarm.findAll({
        where: {
            UserId: UserId
        }
    }).then((user) => {
        console.log("user: ", user);
        if (user.length <= 0) {
            console.log("new create!!!!");

            models.Alarm.create({
                status: '1',
                socketId: socketId,
                UserId: UserId,
                tableId: tableId
            })
                .then(result => {
                    res.send(JSON.stringify(result));
                })
                .catch(err => {
                    var error = JSON.stringify(err);
                    error = JSON.parse(error);
                    if (error.name == "SequelizeUniqueConstraintError") {
                        res.send("Userid 주소 중복 에러!!!");
                    } else if (error.name == "SequelizeForeignKeyConstraintError") {
                        res.send("외래키 제약 에러!!!");
                    }
                })
        } else {
            console.log("alarm update socketID!!!!");
            models.Alarm.update({
                socketId: socketId
            }, {
                where: {
                    UserId: UserId
                }
            }).then(result => {
                console.log("socket update done!!!")
                models.Alarm.findOne({
                    where: {
                        UserId: UserId,
                        tableId: tableId
                    }
                }).then((data) => {
                    console.log("find user, tableid: ", data)
                    if (data == null) {
                        models.Alarm.create({
                            status: '0',
                            socketId: socketId,
                            UserId: UserId,
                            tableId: tableId
                        }).then((data) => {
                            console.log("new create other tableid!!!!");
                        })
                    }

                })
                    .catch(err => {

                        var error = JSON.stringify(err);
                        error = JSON.parse(error);

                        if (error.name == "SequelizeUniqueConstraintError") {
                            res.send("Userid 주소 중복 에러!!!");
                        } else if (error.name == "SequelizeForeignKeyConstraintError") {
                            res.send("외래키 제약 에러!!!");
                        }
                    })
            })
        }
    })
};

function find(UserId) {
    return models.Alarm.findOne({
        where: {
            UserId: UserId
        }
    })
};

module.exports = { router, create, find };