const mongoose = require('mongoose');

//user Schema
const signupSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phonenumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
});

//add movies
const movieSchema = mongoose.Schema({
    moviename: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['UA', 'A', 'PG']
    },
    languages: {
        type: String,
        required: true,
        enum: ['Malayalam', 'Hindi', 'Tamil', 'Telugu', 'English']
    },
    cast: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    screen: {
        type: String,
        required: true
    },
    rates: {
        type: Number,
        required: true
    },
    seats: {
        type: Number,
        required: true
    },
    image: {
        data: Buffer, // Store image as binary data
        contentType: String
    },
});

//bookings info
const bookedTicketSchema = mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'movies',
        required: true
    },
    seatNumber: {
        type: [],
        required: true
    },
    username: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    moviename: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    screen: {
        type: String,
        required: true
    }
});

//movie review & rating
const movieReviewSchema = mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'movies',
        required: true
    },
    rating: {
        type: [],
        required: true
    },
    reviewText: {
        type: String,
        required: true
    },
});


const TicketMaster = mongoose.connection.useDb('TicketMaster');

const Signup = TicketMaster.model('TicketMaster', signupSchema);
const Movie = TicketMaster.model('movies', movieSchema);
const BookedTicket = TicketMaster.model('bookings', bookedTicketSchema);
const MovieReview = TicketMaster.model('reviews', movieReviewSchema);
module.exports = { Signup, Movie, BookedTicket, MovieReview };