const express = require('express');
const router = express.Router();

const web3 = require('../module/web3');


router.get('/test',(req,res)=>{
    console.log("e");
   res.json(web3.callcontract())


})




module.exports =router;