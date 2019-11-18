const Web3 = require('web3')
var contract = require("truffle-contract")
const util = require('util')
const assert = require('assert')
const fs = require('fs')
var path = require("path")
path.join(process.cwd(), "AToken.json")


var web3Provider = new Web3.providers.HttpProvider('http://b3b11115.ngrok.io')
var web3 = new Web3(web3Provider)

const AT_contract_json = fs.readFileSync('/home/marf/workspace/work/bitc2c/BITC2C_BACKEND/abi/AToken.json', 'utf-8')
const BT_contract_json = fs.readFileSync('/home/marf/workspace/work/bitc2c/BITC2C_BACKEND/abi/Btoken.json', 'utf-8')
const CT_contract_json = fs.readFileSync('/home/marf/workspace/work/bitc2c/BITC2C_BACKEND/abi/Ctoken.json', 'utf-8')

const ATabi = JSON.parse(AT_contract_json)
const BTabi = JSON.parse(BT_contract_json)
const CTabi = JSON.parse(CT_contract_json)


Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

const AT_contract = contract(ATabi)
const BT_contract = contract(BTabi)
const CT_contract = contract(CTabi)


AT_contract.setProvider(web3Provider)
BT_contract.setProvider(web3Provider)
CT_contract.setProvider(web3Provider)

function createwallet(password) {
    return web3.eth.personal.newAccount(password)
}

function unlockAccount(addr, password) {
    return web3.eth.personal.unlockAccount(addr, password, 0)
}

async function signTest(addr, pass) {
    try {
        var res = await web3.eth.personal.sign("Hello world", addr, pass)
        console.log('sign res ', res)

        // recover the signing account address using original message and signed message
        res = await web3.eth.personal.ecRecover("Hello world", res)

        return true
    } catch (e) {
        //console.error(e)
        console.log('recover fail')
        return false
    }
}

function getbalance(addr) {
    return new Promise(((resolve, reject) => {
        let balances = [-1, -1, -1, -1]
        var BN = web3.utils.BN
        AT_contract.deployed().then(function (instance) {
            instance.balanceOf(addr)
                .then((data) => {
                    console.log(BN(data).toNumber())
                    balances[0] = new BN(data).toNumber()
                    if (balances[0] !== -1 && balances[1] !== -1 && balances[2] !== -1 && balances[3] !== -1)
                        resolve(balances)
                })
        })

        BT_contract.deployed().then(function (instance) {
            instance.balanceOf(addr)
                .then((data) => {
                    console.log(BN(data).toNumber())
                    balances[1] = new BN(data).toNumber()
                    if (balances[0] !== -1 && balances[1] !== -1 && balances[2] !== -1 && balances[3] !== -1)
                        resolve(balances)
                })
        })

        CT_contract.deployed().then(function (instance) {
            instance.balanceOf(addr)
                .then((data) => {
                    console.log(BN(data).toNumber())
                    balances[2] = new BN(data).toNumber()
                    if (balances[0] !== -1 && balances[1] !== -1 && balances[2] !== -1 && balances[3] !== -1)
                        resolve(balances)
                })
        })

        web3.eth.getBalance(addr)
            .then((data) => {
                console.log(data)
                balances[3] = new BN(data).toNumber()
                if (balances[0] !== -1 && balances[1] !== -1 && balances[2] !== -1 && balances[3] !== -1)
                    resolve(balances)
            })
    }))
}


async function transfer(addr_1, token_1, token_1_value, addr_2, token_2, token_2_value) {
    return new Promise(((resolve, reject) => {
        const tokenName = ["AToken", "BToken", "CToken"]
        const contracts = [AT_contract, BT_contract, CT_contract]
        let contract_1
        let contract_2
        let userBal_1
        let userBal_2
        var BN = web3.utils.BN

        for (let i; i < tokenName.length; i++) {
            if (token_1 === tokenName[i]) {
                contract_1 = contracts[i]
                contract_1.deployed()
                    .then(function (instance) {
                        instance.balanceOf(addr_1)
                            .then((data) => {
                                userBal_1 = new BN(data).toNumber()
                            })
                    })
            }
            if (token_2 === tokenName[i]) {
                contract_2 = contracts[i]
                contract_2.deployed()
                    .then(function (instance) {
                        instance.balanceOf(addr_2)
                            .then((data) => {
                                userBal_2 = new BN(data).toNumber()
                            })
                    })
            }
        }

        if (token_1_value < userBal_1 && token_2_value < userBal_2) {
            contract_1.deployed()
                .then(function (instance) {
                    instance.transfer(addr_2, token_1_value, {from: addr_1})
                    contract_2.deployed()
                        .then(function (instance) {
                            instance.transfer(addr_1, token_2_value, {from: addr_2})
                                .then(() => {
                                    resolve(true)
                                })
                        })
                })

        } else {
            reject("balance 부족")
        }


    }))


}

module.exports = {createwallet, getbalance, unlockAccount, transfer, signTest}