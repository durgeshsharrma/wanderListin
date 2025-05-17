if(process.env.NODE_ENV != 'production'){
    require('dotenv').config();
}



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Booking = require('./models/booking')
const flash = require("connect-flash");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const session = require("express-session");
const Listing = require('./models/listing.js')
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const MongoStore = require('connect-mongo');



// const store = MongoStore.create({
//     mongoUrl : 'mongodb://127.0.0.1:27017/wanderlust',
//     crypto : {
//         secret : 'mysecretcode'
//     } ,
//     touchAfter : 24*3600,
// }) ;





const sessionOptions = {
    
    secret : "mysecretcode",
    resave: false,
    saveUninitialized: true,
    cookie : {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    },
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
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



app.post("/create-checkout-session/:id", async (req, res) => {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);

    if (!listing) {
        return res.status(404).send("Listing not found");
    }

    try {
        // Create a Checkout Session with Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",  // Change to "inr" or another currency if needed
                        product_data: {
                            name: listing.title,
                            images: [listing.image],
                        },
                        unit_amount: listing.price * 100, // Amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}&listingId=${listingId}`,
            cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
        });

        // Return the session id to the frontend
        res.json({ id: session.id });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});






// Success route
app.get("/success", async (req, res) => {
    const sessionId = req.query.session_id;
    const listingId = req.query.listingId;

    // Ensure the user is authenticated
    if (!req.user) {
        req.flash("error", "You must be logged in to complete the payment.");
        return res.redirect("/login");  // Redirect to login if user is not authenticated
    }

    if (!sessionId || !listingId) {
        return res.status(400).send("Invalid request");
    }

    try {
        // Retrieve the session to verify payment status
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Check if the payment was successful
        if (session.payment_status === 'paid') {
            // Retrieve the listing
            const listing = await Listing.findById(listingId);
            if (!listing) {
                return res.status(404).send("Listing not found");
            }

            // Create a new booking for the user
            const booking = new Booking({
                listing: listing._id,
                user: req.user._id,  // Use the authenticated user ID
                paymentStatus: 'paid',
                paymentIntentId: session.payment_intent,
                createdAt: new Date(),
            });

            await booking.save();

            // Redirect to the home page with a success message
            req.flash("success", "Payment successful and booking created!");
            res.redirect('/listing');
        } else {
            // Payment was not successful
            req.flash("error", "Payment was not successful.");
            res.redirect('/?cancel=true');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Cancel route
app.get("/cancel", (req, res) => {
    req.flash("error", "Payment was canceled.");
    res.redirect("/?cancel=true");
});








const listing  = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const user = require("./routes/user.js");
const booking = require('./routes/booking.js')



// database connection
main()
.then(() => {
    console.log("connected to db");
})
.catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
  });
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




app.use( listing);
app.use("/listing/:id/reviews" , reviews);
app.use("/", user);
app.use(booking)


//sab route ke liye
app.all("*" , (req, res, next) => {
    res.render('pageNotFound' );
});

//error handler
app.use((err , req , res , next) => {

    let {statusCode , message} = err;
    res.render("error.ejs", { err } )

})

app.listen( process.env.PORT || 8000 , () => {
    console.log(`server is listening on port 8080 `);
});