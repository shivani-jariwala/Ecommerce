const express = require('express');

const { check,body } = require('express-validator/check');  //check is sub package in express validator. {check} pulls out the check function. destructuring syntax

const authController = require('../controllers/auth');

const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [
        body('email')
            .isEmail()
            .withMessage('please enter a valid email address')
            .normalizeEmail(),   //sanitizing input i.e. removing white spaces and all converting input email to lowercase 
        body('password','password has to be valid')
            .isLength({min:5})
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post('/signup',
    [   
    check('email')
        .isEmail()
        .withMessage('invalid email')
        .custom((value,{ req }) =>{   //customise validation
            // if(value ==='abc@test.com'){
            //     throw new Error('this email is forbidden');
            // }
            // return true;
            return User.findOne({ email: value }).then(userDoc => {
                if (userDoc) {
                  return Promise.reject(
                    'E-Mail exists already, please pick a different one.'
                  );
                }
              });
      
        })
        .normalizeEmail(),
    body('password','please enter a password with text and numbers and at least 5 characters long')
        .isLength({min:5})
        .isAlphanumeric()
        .trim(),   //this is sanitizing input
    body('confirmPassword').trim().custom((value,{req}) =>{
        if(value!==req.body.password){
            throw new Error('password must match!');
        }
        return true;
    })
    ],
         authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;