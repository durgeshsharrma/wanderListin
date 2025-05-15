const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const Listing = require("../models/listing");
const Booking = require("../models/booking");

router.post("/booking/:id", isLoggedIn, async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listing");
    }

    try {
        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd", // Change to your desired currency
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
            success_url: `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
        });

        // Store booking in database with pending payment status
        const booking = new Booking({
            listing: listing._id,
            user: req.user._id,
            paymentStatus: 'pending',  // Pending until payment is confirmed
        });

        await booking.save();

        res.json({ id: session.id });
    } catch (err) {
        console.error(err);
        req.flash("error", "Payment session creation failed.");
        res.redirect(`/listing/${id}`);
    }
});

router.get('/booking', isLoggedIn, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate('listing');
        res.render('listings/booking', { bookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


// In booking.js or app.js
router.get('/booking/:id', isLoggedIn, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('listing');
        if (!booking) {
            return res.status(404).send("Booking not found");
        }

        res.render('listings/bookingDetail', { booking });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;
