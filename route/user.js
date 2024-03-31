const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config')
const {User, Account} = require('../db')
const authMiddleware = require('./Middlewares/jwtAuthMiddleware');
const zod = require('zod');
const { ObjectId } = require('mongodb');

const userSignupSchema = zod.object({
    userName : zod.string().email(),
    password : zod.string(),
    firstName : zod.string(),
    lastName : zod.string(),
})  

//Update Schema
// const userUpdateSchema = zod.object({
//     userName : zod.string().optional(),
//     password : zod.string().optional(),
//     firstName : zod.string().optional(), 
//     lastName : zod.string().optional(),
// })
 

// const validateUpdateUserData = (req, res, next) => {
//     const body = req.body;
     
//     try {
//         userUpdateSchema.parse(body);
        
//         next();
//     } catch (error) {
//         res.status(400).json({error : 'fails input validations '});
//     }
// } 



const validateSignupData = (req, res, next) => {
    const body = req.body;
    console.log(body);
    try {
        userSignupSchema.parse(body);
        next();
    } catch (error) { 
        console.log(error);
        res.status(400).json({error : 'Invalid Input format'});
    }
} 


router.post('/signup', validateSignupData, async  (req, res, next) => {
    const body = req.body;
    const user = await User.findOne({
        userName : body.userName,
    })
    if(user){
        return res.json({
            msg : 'email already taken / Incorrect Input'
        });
    }

    const dbUser = await User.create({
        userName : body.userName,
        password : body.password,
        firstName : body.firstName,
        lastName : body.lastName,
    });

    const userId = dbUser._id;

    const userAccount = await Account.create({
        userId,
        balance : 1 + Math.random()*10000,
    })

    const token = jwt.sign({userId : dbUser._id}, JWT_SECRET);

    res.json({
        message : 'user created successfully',
        token : token,
    })
})


router.post('/signin', authMiddleware, async (req, res, next) => {
    const body = req.body;

    const userExist = await User.findOne({
        userName : body.userName,
        password : body.password,
    })

    if(!userExist){
        res.json({
            message : 'user does not exist / signup',
        })
    }
    // Must create a token and send it back
    const token  = jwt.sign({_id:userExist._id},JWT_SECRET);

    res.json({message : 'logged in successfully',token});

});


router.get('/profile', authMiddleware, async (req, res, next) => {
    //try catch
    const authHeader = req.headers.authorization;

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);


    const filter = decoded.userId;

    // const mainUser = await User.findOne({ _id: new ObjectId(filter) });
    const mainUser = await User.findOne({ _id: filter });

    res.json({message : 'ok'}); 
})


router.put('/',validateSignupData,authMiddleware, async (req, res, next) => {
    const body = req.body;
    const updateUser = await updateOne(req.body,{id : req.userId});
    res.json({
        message : "updated successfully"
    });
});



router.get('/bulk', authMiddleware, async (req, res, next) => {
    const filter = req.query.filter || "";

    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.userId;

    //What is this
    const users = await User.find({
       $or: [{
            firstName : {"$regex" : filter,  $options: 'i'}
       }, {
        lastName : {"$regex" : filter,  $options: 'i'}
       }
       ]
    })

    const userList = users.filter((user) => user._id != userId);

    res.json({
        user : userList.map(user => ({
            userName : user.userName, 
            firstName : user.firstName, 
            lastName : user.lastName,
            _id : user._id,
        }))
    })


})


module.exports = router;