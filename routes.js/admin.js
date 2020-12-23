
const path = require('path');

const express = require('express');

const {body} = require('express-validator/check');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
 router.get('/add-product',isAuth, adminController.getAddProduct); //request funnels from left to right first it goes to isAuth and then maybe to adminController

// // /admin/products => GET
 router.get('/products',isAuth, adminController.getProducts);

// // /admin/add-product => POST
 router.post('/add-product',[
    body('title')
        .isString()
        .isLength({min:3})
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({min:3,max:400})
        .trim()
     
 ],isAuth, adminController.postAddProduct);

 router.get('/edit-product/:productId',isAuth, adminController.getEditProduct);

 router.post('/edit-product',[
    body('title')
        .isString()
        .isLength({min:3})
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({min:5,max:400})
        .trim()
     
 ],isAuth,adminController.postEditProduct);

 router.post('/delete-product',isAuth,adminController.postDeleteProduct);

module.exports = router;

//[{"id":"123456","title":"A Book","imageUrl":"https://www.publicdomainpictures.net/pictures/10000/velka/1-1210009435EGmE.jpg","description":"This is an awesome book!","price":"19"},{"title":"fe","imageUrl":"","description":"","price":"","id":"0.4075144570806024"},{"title":"another","imageUrl":"","description":"nice","price":"78","id":"0.730118212138186"}]

