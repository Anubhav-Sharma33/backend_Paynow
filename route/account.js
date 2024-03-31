const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
 


const {Account} = require('../db');
const authMiddleware = require('./Middlewares/jwtAuthMiddleware');
const { default: mongoose } = require('mongoose');
const JWT_SECRET = require('../config');

 
router.get('/balance',authMiddleware, async (req, res, next) => {
 
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
 
        const userId = decoded.userId;
        const account = await Account.findOne({userId});

        res.json({balance : account.balance});
    } catch (error) {
        res.json({message : "something went wrong while fetching balance"})
    }
})



// ------ money transfer using transaction of mongodb to make sure the database will not be inconsistent
router.post('/transfer',authMiddleware, async (req, res, next) => {
    
    const session = await mongoose.startSession();
    session.startTransaction();
     

    const body = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1]; 
    const decoded = jwt.decode(token);

    const firstName = body.firstName;
    const to = body.to;
    const amount = body.amount;
    const userId = decoded.userId;  
    
    console.log(firstName,to,amount,token, decoded);

    const account = await Account.findOne({userId : userId}).session(session);
    if(!account || account.balance < amount){
        await session.abortTransaction();
        return res.status(400).json({message : 'Insufficient balance'});
    }

    const toAccount = await Account.findOne({userId : to}).session(session);
    if(!toAccount){
        await session.abortTransaction();
        return res.status(400).json({message : 'Invalid account'});
    }

    await Account.updateOne({userId}, {$inc : {balance : -amount}}).session(session);
    await Account.updateOne({userId : to}, {$inc : {balance : amount}}).session(session);

    await session.commitTransaction();

    res.json({message : 'Transaction successful'});

})




module.exports = router;

  