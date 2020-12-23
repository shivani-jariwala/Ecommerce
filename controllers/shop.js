const fs = require('fs');
const path = require('path');

const Product = require('../models/product');
const Order = require('../models/order');
const PDFDocument = require('pdfkit');

const ITEM_PER_PAGE =2;
exports.getProducts = (req, res, next) => {
  // Product.find() //find() method in case of mongoose returns all the data in form of array. find() is a default method in mongoose
  //   .then(products => { 
  //     res.render('shop/product-list', {
  //       prods: products,
  //       pageTitle: 'All Products',
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => {
  //     const error = new Error(err);
  //     error.httpStatusCode =500;
  //     return next(error);
  //   });
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(numProducts =>{
      totalItems = numProducts;
      return Product.find()
      .skip((page-1)*ITEM_PER_PAGE)
      .limit(ITEM_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage:page,
        hasNextPage: ITEM_PER_PAGE*page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page-1,
        lastPage:Math.ceil(totalItems/ITEM_PER_PAGE)
      });
    })
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId) //findById is a mongoose method by default. also mongoose automatically converts the string to objectId by itself 
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(numProducts =>{
      totalItems = numProducts;
      return Product.find()
      .skip((page-1)*ITEM_PER_PAGE)
      .limit(ITEM_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage:page,
        hasNextPage: ITEM_PER_PAGE*page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page-1,
        lastPage:Math.ceil(totalItems/ITEM_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
        .populate('cart.items.productId')
        .execPopulate() //this is used bcoz populate doesn't returns a promise and therefore then block can't work on it.
        .then(user => {
          const products = user.cart.items;
          res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products
          })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product =>{
      return req.user.addToCart(product)
    }).then(result=>{
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user =>{
      const products= user.cart.items.map(i=>{
        return { quantity: i.quantity,product:{...i.productId._doc}}; //i.productId._doc along with spread operator will take out all the meta data from the productId, meta data includes title,price,des,imageurl,id.
      });
      const order = new Order({
        user:{
          email:req.user.email,
          userId:req.user
        },
        products:products
      });
      return order.save();
    }).then(result =>{
      return req.user.clearCart()
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id})
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order =>{
      if(!order){
        return next(new Error('no order found'));
      }
      if(order.user.userId.toString()!==req.user._id.toString()){ //to check the order belongs to that particular user who placed the order. to verify copy the orderId from one user ac and paste in url of another user ac then it will not show the orders
        return next(new Error('unauthorized user'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf'; //here we read the hardcoded file
      const invoicePath = path.join('data','invoices',invoiceName);

      const pdfDoc = new PDFDocument();//readable stream 
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition','inline; filename="'+ invoiceName + '"');
      pdfDoc.pipe(fs.createWriteStream(invoicePath)); //creates a writestream at invoicepath and piplines its output to the response res which happens to be a writable readstream 
      pdfDoc.pipe(res); //res is a writable readstrem,pdfdoc is areadable

      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      });
      pdfDoc.text('-----------------------');
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              ' - ' +
              prod.quantity +
              ' x ' +
              '$' +
              prod.product.price
          );
      });
      pdfDoc.text('---');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

      pdfDoc.end();
    //   fs.readFile(invoicePath,(err,data)=>{  //code for downloading the invoice file
    //   if(err){
    //    return next(err); //default error handling page
    // }
    // res.setHeader('Content-Type','application/pdf');
    // res.setHeader('Content-Disposition','inline; filename="'+ invoiceName + '"');// inline means opens in browser directly, if in place of inline you type attachment than the browser asks to download it first
    // res.send(data);
   // });

  //  const file = fs.createReadStream(invoicePath); //we use streams instead of readfile bcoz with readfile node first takes the file content into memory and then outputs which is not good when dealing with large files
  //  res.setHeader('Content-Type','application/pdf');
  //  res.setHeader('Content-Disposition','inline; filename="'+ invoiceName + '"');
  //  file.pipe(res);//readstream is readable and res is writable. we can use readable streams to pipe their output into a writable streams
    })
    .catch(err => next(err));
  
};


