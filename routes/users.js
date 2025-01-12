var express = require('express')
const models = require('../models')
var bcrypt = require('bcrypt')
var router = express.Router()
let jwt = require("jsonwebtoken")
let secretObj = require("../config/jwt")
const nodemailer = require('nodemailer')
const web3 = require('../module/web3');

//토큰을 이용하여 유저정보 가져오기
router.get('/getuser', function (req, res) {
    const token = req.headers.authorization.split(' ')[1]
    console.log("token rrrrrrrr",token);
    //const boardId= req.param('boardId');
    //console.log(boardId);
    try {
        let decoded = jwt.verify(token, secretObj.secret)
        if (decoded) {
            console.log('decode ====');
            res.send(decoded)
        }
    } catch (e) {
        res.status(401).send(e.message)
    }
})

//이메일 확인 요청 링크 클릭시 오는 라우
router.get('/emailcheck', function (req, res) {
    let email = req.query.email
   

    models.User.update({
        emailcheck: "1",
    }, {
        where: {email: email}
    }).then(result => {
        console.log(result, "권한 추가 완료")
        res.redirect("http://localhost:3000/user/login")
    }).catch(err => {
        console.log(err, "에러!!!")
    })
})

//crypto confirm
router.post('/login', (req, res, next) => {
    models.User.findOne({
        where: {
            email: req.body.email,
            emailcheck: '1'
        }
    }).then((user) => {
        console.log(user)
        if (!user) {
            console.log("aaaa")
            res.status(404).send("가입되지 않은 유저")
        } else {
            const expires = "50m"
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (result == true) {
                    let authToken = jwt.sign({
                            id: user.id,
                            email: req.body.email
                        },
                        secretObj.secret,
                        {
                            expiresIn: expires
                        })
                    res.cookie("logincookie", authToken)
                    res.json({
                        token: authToken,
                        expires : expires
                    })
                } else {
                    res.status(404).send('Incorrect password')
                }
            })
        }
    })
})


router.post('/create', function (req, res, next) {
    var today = new Date()

    let body = req.body
    let email = body.email
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            console.log('bcrypt.genSalt() errer:')
        } else {
            bcrypt.hash(body.password, salt, (err, hash) => {
                models.User.create({
                    name: body.name,
                    email: body.email,
                    password: hash,
                    phone: body.phone,
                    point: 0,
                    createdAt: today,
                    updatedAt: today,
                    emailcheck: 0
                }).then(result => {
                    web3.createwallet(body.password).then((addr)=>{
                        web3.unlockAccount(addr,body.password).then((result)=>{

                        })
                        models.Wallet.create({
                            address:addr,
                            type:"ETH",
                            UserId:result.id
                        }).then(()=>{
                            console.log("데이터 추가 완료")
                            res.send(JSON.stringify(body))
                            emailcreate(email)
                            web3.unlockAccount(addr, body.password)
                        })

                    })
<<<<<<< Updated upstream

                }).catch(err => {
                    console.log("데이터 추가 실패")

                    var error = JSON.stringify(err)
                    error = JSON.parse(error)

                    if (error.name == "SequelizeUniqueConstraintError") {
                        res.status(404).send("이미 가입된 이메일입니다.")
                    } else {
                        res.status(404).send(error)
                    }

=======
                    .catch(err => {
                        console.log("데이터 추가 실패")
                        var error = JSON.stringify(err)
                        error = JSON.parse(error)
                        console.log(error.name)
                        if (error.name == "SequelizeUniqueConstraintError") {
                            res.status(406).send(error)
                        } else {
                            res.status(404).send(error)
                        }
                        // 회원가입 페이지로 이동
                        // request.post({
                        //   url: 'http://localhost:5555/register/',
                        //   body: {
                        //     email: email
                        //   },
                        //   json: true
                        // }, function (err, response, body) {
                        //   console.log(err);
                        //   res.json(body);
                        // });
>>>>>>> Stashed changes

                    })

            })
        }
    })
    // res.redirect('/');
})

function emailcreate(nodeemail) {
    let email = nodeemail

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'a01026879718@gmail.com',  // gmail 계정 아이디를 입력
            pass: 'a01026879718'          // gmail 계정의 비밀번호를 입력
        }
    })

    let mailOptions = {
        from: 'a01026879718@gmail.com',    // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
        to: email,                     // 수신 메일 주소
        subject: '안녕하세요, OOOO입니다. 이메일 인증을 해주세요.',
        html: '<p>아래의 링크를 클릭해주세요 !</p>' +
            "<a href='http://localhost:5555/users/emailcheck/?email=" + email + "'>인증하기</a>"
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log("error")
        } else {
            console.log('Email sent: ')
            res.send(info.response)
        }
    })

}

module.exports = router
