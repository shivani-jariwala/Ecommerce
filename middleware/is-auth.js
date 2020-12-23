module.exports = (req,res,next) =>{
    if(!req.session.isLoggedIn){     //this is used to check if the user is logged in or not. if not logged in then directed to login page if logged in then can add products. this is protecting routes
           return res.redirect('/login');
         }
        next();
}