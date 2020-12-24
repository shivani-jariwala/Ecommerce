
const path = require('path');

const express = require('express');
//const dotenv = require('dotenv');
require('dotenv').config()

const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash'); //flash is used along with redirect to show some msgs to user.once the msg is displayed to the user the flash msgs are then destroyed
const multer = require('multer');

const errorController = require('./controllers/error');
const User = require('./models/user');
// const { v4: uuidv4 } = require('uuid');


const MONGODB_URI =process.env.MONGODB_URI;


const app = express();
const store = new MongoDBStore({
    uri:MONGODB_URI,
    collection:'sessions'
});
const csrfProtection = csrf();
const { v4: uuidv4 } = require('uuid');
 
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, uuidv4())
    }
});

// const storage = multer.diskStorage({ //this is used in place of dest:images. it is a full configuration showing where the image of product gets stored
//     destination:function(req,file,cb){  //which is the folder where image will get stored
//         cb(null,'images');
//     },
//     filename: function(req,file,cb){   //in that folder the name of the file where product image will get stored
//         cb(null,uuidv4)        
//     }
// });

// const fileFilter = (req,file,cb)=>{  //to accept only png,jpg,jpeg file types and not pdf,gif
//     if(file.mimetype === 'image/png' ||
//     file.mimetype === 'image/jpg' ||
//     file.mimetype === 'image/jpeg'
//     ){
//         cb(null,true);
//     }else{
//         cb(null,false);
//     }

// };


app.set('view engine','ejs');
app.set('views','views');

const adminRoutes = require('./routes.js/admin.js');
const shopRouter = require('./routes.js/shop.js');
const authRoutes = require('./routes.js/auth.js');

app.use(bodyParser.urlencoded({extended: false})); //urlencoded can not handle binary data i.e. file data and so new package named multer is installed to handle file requests that have binary data
app.use(multer({storage:storage}).single('image')) //expecting only 1 file with name image  //images a new file in explorer gets created and it has the image that user enteres in add product page
app.use(express.static(path.join(__dirname,'public')));
app.use('/images',express.static(path.join(__dirname,'images'))); // statically serving means the files in images folder are handled automatically. adding /images means if we have starting as /images then only serve them statically. express assumes that the files to be served are in the root folder but we know they are iin images folder,so we have to add /images
app.use(session({secret:'my secret', resave:false, saveUninitialized:false, store:store})); //saveUninitialized:false means the session will not be stored unless any change is made
app.use(csrfProtection);
app.use(flash()); //do this after the session is defined, flash is used on req

app.use((req,res,next) =>{
    if (!req.session.user) {
        return next();
     }
      User.findById(req.session.user._id)
      .then(user => {
          if(!user){  //just to check if user with that id is not found bcoz it might have been deleted in between, if that user id not found then continue without user by not to get any undefined user
              return next();
          }
        req.user = user;
        next();
      })  
    .catch(err=>{   //this will not fire if user with that id is not found. but will fire when any technical errors such as server down or user doesn't have certain permissions
      throw new Error(err);
    }  ); 
});
app.use((req,res,next)=>{
    res.locals.isAuthenticated=req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});
app.use('/admin',adminRoutes);
app.use(shopRouter);
app.use(authRoutes);

app.use('/500',errorController.get500); //we can now use res.redirect('/500') in catch block whenever we want to show error page
app.use(errorController.get404);

app.use((error,req,res,next)=>{ //this will  be handled by express when next(error) is passed //also this is a central error handling middleware which will handle error for all routes
    // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
});



mongoose.connect(MONGODB_URI)
    .then(result=>{
        app.listen(3000,() => {
            console.log('Server started at port 3000');
        });
    })
    .catch(err=>{
    console.log(err);
});
//to share data across requests we need sessions 
//multer is useful as it helps us to handle files taht has binary data which is not the case with body parser urlencoded. urlencoded stores plain text,numbers,strings as text. to enable multer enctype should be configured as multiform. 



