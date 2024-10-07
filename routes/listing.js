const express = require("express");
const router = express.Router();
const WrapAsync = require("../utilis/WrapAsync.js");
const ExpressError = require("../utilis/ExpressError.js");
const { listingSchema , reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const {isLoggedIn , isOwner } = require("../middleware.js");
const multer = require('multer');
const {storage} = require('../cloudinaryConfig.js');
const upload = multer({
    storage,
})


const validateReview = (req, res, next) => {
    let{ error } = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400 , errMsg);

    }else{
        next();
    }
}

//home route which show all data 
router.get("/" ,WrapAsync (async (req , res) => {
    let AllData = await Listing.find({});

    res.render("listings/home.ejs" , {AllData});
}));




//update or add on listing page ya phir home page par dikahayega add wala jo add kiya
router.post("/" ,upload.single('listing[image]'), WrapAsync (async (req , res , next) => {
    res.send(req.file);
//     let result = listingSchema.validate(req.body);
//     console.log(result);
//     if (result.error){
//         throw new ExpressError(400 , result.error);
//     }
//   const newListing = new Listing(req.body.listing);
//   newListing.owner = req.user._id;
//   newListing.save();
//   req.flash("success" , "New Listing Created");
//   res.redirect("/listing");
}));


// new Route create new yaha form render hua new route par
router.get("/new" ,isLoggedIn, (req , res) => {
    
    res.render("listings/createNew.ejs");
});


// show Route
router.get("/:id" ,WrapAsync (async (req,res , next) => {
         let {id} = req.params;
         let Info = await Listing.findById(id).populate({path: "reviews" ,populate : { path : "author" } }).populate("owner");
         if(!Info) {
            req.flash("error" , "Listing you requested for does not exist");
           return res.redirect("/listing");
                 }
                 console.log(Info);
         res.render("listings/show.ejs" , {Info});
}));

// EDIT ROUTE
router.get("/:id/edit" ,isLoggedIn, isOwner ,WrapAsync(async (req , res) => {
    let {id} = req.params;
    let Info = await Listing.findById(id);
    res.render("listings/edit.ejs" , {Info})
}));

//UPDATE ROUTE update the value
router.put("/:id" ,isLoggedIn,isOwner, WrapAsync(async (req , res,next) => {
    let {id} = req.params; 
  let t =  await Listing.findByIdAndUpdate(id , req.body).populate({path: "reviews" ,populate: { path : "author" } }).populate("owner");
    console.log(t);
    req.flash("success" , "Listing Was Updated");
    res.redirect(`/listing/${id}`);
}));

//Delete Route
router.delete("/:id" ,isLoggedIn, isOwner ,WrapAsync ( async (req,res,next) => {
    let {id} = req.params;
   let deletedListing = await Listing.findByIdAndDelete(id);
   req.flash("success" , "Listing was Deleted");
   res.redirect("/listing");

}))


module.exports = router;