if(process.env.NODE_ENV != 'production'){
     require('dotenv')
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utilis/ExpressError.js");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");


const sessionOptions = {
    secret : "mysecretcode",
    resave: false,
    saveUninitialized: true,
    cookie : {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    },
} 


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req , res , next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})


const listing  = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const user = require("./routes/user.js");



// database connection
main()
.then(() => {
    console.log("connected to db");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}


app.use(methodOverride("_method"));
app.use(express.urlencoded({extended : true}));
app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname , "/public")));
app.engine("ejs" , ejsMate);


// const validateReview = (req, res, next) => {
//     let{ error } = reviewSchema.validate(req.body);
//     if(error) {
//         let errMsg = error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400 , errMsg);

//     }else{
//         next();
//     }
// }




app.use("/listing" , listing);
app.use("/listing/:id/reviews" , reviews);
app.use("/" , user);


//sab route ke liye
app.all("*" , (req, res, next) => {
    next(new ExpressError(404 , "Page Not Found"));
});

//error handler
app.use((err , req , res , next) => {
    let {statusCode , message} = err;
    
      res.render("error.ejs", { err } )
})

app.listen( 3000 , () => {
    console.log(`server is listening on port 8080 `);
});