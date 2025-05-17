const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const ExpressError = require("../utilis/ExpressError.js");
const WrapAsync = require("../utilis/WrapAsync.js");
const passport = require("passport");
const {saveRedirectUrl} = require("../middleware.js");



router.get("/signup" , (req , res) => {
    res.render("user/user.ejs");
});


router.post("/signup" ,WrapAsync (async (req, res) => {
     try {let {email , username , password} = req.body;
     const User1 = new User ({
        email : email,
        username: username,
        
     });

    const registeredUser = await User.register(User1 , password) ;
    console.log(registeredUser);
    req.login(registeredUser , (err)=>{
        if(err){
            next(err);
        }
        req.flash("success" , "Welcome To Wanderlust");
    res.redirect("/");
    })
}
    catch(e){
        req.flash("error" , e.message);
        res.redirect("/signup");
    }
}));

router.get("/login" , (req, res) => {
    res.render("user/login.ejs");
    
})


router.post("/login" , saveRedirectUrl ,passport.authenticate("local" , { failureRedirect: "/login", failureFlash:true }),async (req, res) => {
    req.flash("success" , "Welcome Back To Wanderlust");
    let redirectUrl = res.locals.redirectUrl || "/";
    res.redirect(redirectUrl);
});

router.get("/logout" , (req , res ,next) => {
    req.logout((err) => {
        if(err) {
            next(err);
        }
        req.flash("success" , "Logout Successful");
        res.redirect("/login");
    })
})



module.exports = router;