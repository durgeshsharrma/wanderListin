const express = require("express");
const router = express.Router({mergeParams:true});
const WrapAsync = require("../utilis/WrapAsync.js");
const ExpressError = require("../utilis/ExpressError.js");
const Review = require("../models/review.js");
const { reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const { isLoggedIn , isReviewAuthor } = require("../middleware.js");


const validateReview = (req, res, next) => {
    let{ error } = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400 , errMsg);

    }else{
        next();
    }
}


router.post("/" ,isLoggedIn , validateReview ,WrapAsync(async(req , res) => {
    let listing = await Listing.findById(req.params.id);
    let NewReview = new Review(req.body.review);
    NewReview.author = req.user._id;
    listing.reviews.push(NewReview);
    console.log(NewReview);
    await NewReview.save();
    await listing.save();
 
    console.log("new review saved");
    req.flash("success" , "New Review Added");
    res.redirect(`/listing/${listing._id}`);
 
 
 }))
 
 
 // review delete Route
 router.delete("/:reviewId",isLoggedIn, isReviewAuthor , WrapAsync(async (req, res) => {
     let { id, reviewId } = req.params;
     console.log(id, reviewId);
     await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
     await Review.findByIdAndDelete(reviewId);
     req.flash("success" , "Review Was Deleted");
     res.redirect(`/listing/${id}`);
 }));


 module.exports = router;