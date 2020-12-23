const User = require('../models/user');
const bcrypt = require('bcryptjs');
const {validationResult} = require('express-validator/check');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key:'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'
  }
}))

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if(message.length>0){
    message=message[0];
  }else{
    message=null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage:message,
    oldInput:{
      email:'',
      password:'',
    },
    validationErrors:[]
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if(message.length>0){
    message=message[0];
  }else{
    message=null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage:message, //flash msg goes along with render pages and flash msgs use sessions
    oldInput:{
      email:"",
      password:'',
      confirmPassword:''
    },
    validationErrors:[]  //we have empty array if we load that page without errors
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password=req.body.password;
  const errors= validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage:errors.array()[0].msg,
      oldInput:{       //this is done to have back the email and password even if they are wrong 
        email:email,
        password:password
      },
      validationErrors:errors.array()   //this is basically to put red lining across the box that has errors. but we're not doing this
    });

  }
  User.findOne({email:email})
    .then(user =>{
      if(!user){
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage:'invalid email or password',
          oldInput:{       //this is done to have back the email and password even if they are wrong 
            email:email,
            password:password
          },
          validationErrors:errors.array() 
        })
      }
      bcrypt.compare(password,user.password) //whether pasword match or not the next then block is alwys executed
        .then(doMatch=>{ //here matching is done
          if(doMatch){
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
            console.log(err);
            res.redirect('/');
          });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage:'invalid email or password',
            oldInput:{       //this is done to have back the email and password even if they are wrong 
              email:email,
              password:password
            },
            validationErrors:errors.array() 
          });
        })
        .catch(err=>{
          console.log(err);
          res.redirect('/login')
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors= validationResult(req); //on req in auth.js routes file we have check('email').isEmail() which will throw errors if any and will get stored in this errors const.
  if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('auth/signup', {   //status(422) is error status
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage:errors.array()[0].msg,
      oldInput:{     //this to written to have the email and password even if user entered it wrong. so that user don't have to type it again and again
        email:email,
        password:password,
        confirmPassword:confirmPassword
      },
      validationErrors:errors.array()
     });
  }
     bcrypt.hash(password,12) // since it is asynchronous it returns a promise 
      .then(hashedPassword =>{    //then block is added here bcoz when return res.rediredct('/signup') is executed then a promise is returned which should be executed only after hash password is done therefore then block is chained with encyrption block 
        const user = new User({
          email:email,
          password:hashedPassword,
          cart:{items:[]}
        });
        return user.save();
      })
        .then(result=>{
          res.redirect('/login');
          return transporter.sendMail({
            to:email,
            from:'shivujaris@gmail.com',
            subject:'signup successful',
            html:'<h1>you successfully signed up!</h1>'
          });
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode =500;
          return next(error);
        });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; //date right now + 1 hr
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'shivujaris@gmail.com',
          subject: 'Password reset',
          html: `    
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p> 
          `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode =500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req,res,next) =>{
  const token = req.params.token;
  User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now() } })
    .then(user=>{
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId:user._id.toString(), //convert objectid to string
        passwordToken:token
      });

    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};
exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode =500;
      return next(error);
    });
};

//5f819c1b7f11153b985a64fa