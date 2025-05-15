const express = require("express");
const router = express.Router();
const WrapAsync = require("../utilis/WrapAsync.js");
const ExpressError = require("../utilis/ExpressError.js");
const { listingSchema , reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const { isLoggedIn , isOwner } = require("../middleware.js");
const multer = require('multer');
const { storage } = require('../cloudinaryConfig.js');
const upload = multer({ storage });

// Geocoding client setup (Mapbox example)
// const mapbox = require('@mapbox/mapbox-sdk');
// const geocodingClient = mapbox({ accessToken: process.env.MAPBOX_TOKEN }).geocoding;




// Home route which shows all listings
router.get("/", WrapAsync(async (req, res) => {
    const { query } = req.query; // Access the search query parameter
    let AllData;

    if (query) {
        // Perform search if query exists
        AllData = await Listing.find({
            title: { $regex: query, $options: 'i' }  // Case-insensitive search for listings with matching title
        });
    } else {
        // If no query, fetch all listings
        AllData = await Listing.find({});
    }

    res.render("listings/home.ejs", { AllData, query });
}));

// Create new listing
router.post("/", isLoggedIn, upload.single('listing[image]'), WrapAsync(async (req, res, next) => {
    // let response = await geocodingClient.forwardGeocode({
    //     query: 'Paris, France',  // Replace with dynamic query
    //     limit: 2
    // }).send();
    // console.log(response.body);  // Log the geocoding response

    let result = listingSchema.validate(req.body);
    if (result.error) {
        throw new ExpressError(400, result.error);
    }

    const newListing = new Listing(req.body.listing);
    newListing.image = req.file.path;
    newListing.owner = req.user._id;
    await newListing.save().then((res) => {
        console.log(res);
    });
    
     
    req.flash("success", "New Listing Created");
    res.redirect("/listing");
}));


// New listing form
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/createNew.ejs");
});



// Show route for a specific listing
router.get("/:id", WrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let Info = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    if (!Info) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listing");
    }
    console.log(Info)
    res.render("listings/show.ejs", { Info });
}));

// Edit route
router.get("/:id/edit", isLoggedIn, isOwner, WrapAsync(async (req, res) => {
    let { id } = req.params;
    let Info = await Listing.findById(id);
    res.render("listings/edit.ejs", { Info });
}));

// Update route
router.put("/:id", isLoggedIn, isOwner, upload.single('image'), WrapAsync(async (req, res, next) => {
    let { id } = req.params;
    let t = await Listing.findByIdAndUpdate(id, req.body);

    if (typeof req.file !== 'undefined') {
        t.image = req.file.path;
        await t.save();
    }
    req.flash("success", "Listing Was Updated");
    res.redirect(`/listing/${id}`);
}));

// Delete route
router.delete("/:id", isLoggedIn, isOwner, WrapAsync(async (req, res) => {
    console.log(req.params)
    let { id } = req.params;
    console.log(id)
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing was Deleted");
    res.redirect("/listing");
}));



module.exports = router;
