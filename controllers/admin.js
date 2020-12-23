const {validationResult} = require('express-validator/check');
const Product = require('../models/product');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError:false,
    errorMessage:null,
    validationErrors:[]
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  if(!image){ //to check if image is defined or undefined //also if file is pdf then errormessage will be thrown
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: false,
      hasError:true,
      product: {
        title:title,
        price:price,
        description:description
      },
      errorMessage:'attached file is not an image',
      validationErrors:[]
    });
  }

  const imageUrl = image.path;
  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: false,
      hasError:true,
      product: {
        title:title,  //if validation fails then we removed the image field 
        price:price,
        description:description
      },
      errorMessage:errors.array()[0].msg,
      validationErrors:errors.array()
    });

  }
  const product = new Product({
    title:title,
    price:price,
    description:description,
    imageUrl:imageUrl,
    userId:req.user // req.user means that all user data is here and mongoose extracts the id from the user info and stores it in userId
  });
  product
    .save() //method provided by mongoose
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => { //for editing the product and rendering it
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        hasError:false,
        editing: editMode,
        product: product,
        errorMessage:null,
        validationErrors:[]
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => { //for storing those changes to database
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError:true,
      product: {             //to still have back the false data that user entered
        title:updatedTitle,
        price:updatedPrice,
        description:updatedDesc,
        _id:prodId
      },
      errorMessage:errors.array()[0].msg, //to display the user what is wrong in the input the user entered
      validationErrors:errors.array()
    });

  }

  Product.findById(prodId)
    .then(product =>{
      if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(image){
        fileHelper.deleteFile(product.imageUrl); //we fired this deletion before editing bcoz we want to clear the unneccesary images that sticks around even after the product gets edited or deleted.
        product.imageUrl = image.path;
      }
      return product.save().then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
 Product.find({userId:req.user._id})
    //.select('title,price,-_id') //select helps us to show which data we want to show. here only title and price will be shown and _id will be excluded
    //.populate('userId','name') //populate allows us to show the userId along with the name property
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  //Product.findByIdAndRemove(prodId) //findByTdAndRemove is a bulit in function provided by mongoose
  Product.findById(prodId)
    .then(product =>{
      if(!product){
        return next(new Error('product not found'));
        
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id:prodId,userId:req.user._id})  
    })
  
  .then(() =>{
      console.log('DESTROY SUCCESSFUL')
      res.redirect('/admin/products');
    })

    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });

  
};
