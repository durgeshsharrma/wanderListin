const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const bookingSchema = new Schema({
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }, // Payment status
    paymentIntentId: { type: String }, // Stripe payment intent ID
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);


