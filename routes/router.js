const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const secretKey = 'TicketMaster';
const nodemailer = require('nodemailer');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const multer = require('multer');
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });


const { Signup, Movie, BookedTicket, MovieReview } = require('../model/schema');

function verifytoken(req, res, next) {
    try {
        if (!req.headers.authorization) throw 'Unauthorized: Token is missing';
        let token = req.headers.authorization.split('Bearer')[1];
        if (!token) throw 'Unauthorized: Token is missing';
        let data = jwt.verify(token, secretkey);
        if (!data) throw 'Unauthorized: Token is invalid';

        console.log('Token verified:', data);
        next()
    } catch (error) {
        res.status(401).send({ error });
    }
};


const transporter = nodemailer.createTransport({
    service: 'Gmail', // e.g., 'Gmail', 'Yahoo', 'Outlook', etc.
    auth: {
        user: 'mail.tktmaster@gmail.com', // Your email address
        pass: 'hoss erqm gfgc fsxc' // Your email password
    }
});


// Signup

router.post("/signup", async (req, res) => {
    try {
        console.log(req.body);
        const user = req.body;
        const newdata = await Signup(user);
        newdata.save();
        res.status(200).json({ message: "POST Successful", api: '/login' });
    } catch (error) {
        res.status(400).json({ message: "POST Unsuccessful", api: '/' });
        console.log(`Cannot POST data`);
    }
});

//login

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    if (email === "admin@gmail.com" && password === "admin123") {
        const data = { email: email, role: "admin" }
        const token = jwt.sign({ data }, secretKey);
        res.status(200).json({ token, role: 'admin', message: 'Admin Login successful', api: '/AdminDash' })
    } else {
        Signup.findOne({ email, password })
            .then(user => {
                if (user) {
                    const name = user.name;
                    const data = { email: email, role: 'user' }
                    const token = jwt.sign({ data }, secretKey);
                    res.status(200).json({ token, role: 'user', message: 'Login successful', api: '/UserDash', user: name })
                } else {
                    res.status(401).json({ error: 'Invalid username or password' });
                }
            })
            .catch(error => {
                res.status(500).json({ error: error.message });
            });
    }
});

// add movies

router.post('/addmovies', upload.single('image'), async (req, res) => {
    try {
        const {
            moviename,
            category,
            languages,
            cast,
            description,
            time,
            screen,
            rates,
            seats,
        } = req.body;

        // Create a new instance of the Mongoose model
        const movie = new Movie({
            moviename,
            category,
            languages,
            cast,
            description,
            time,
            screen,
            rates,
            seats,
            image: {
                data: Buffer.from(req.file.buffer), // Store the image data as binary
                contentType: req.file.mimetype, // Store the content type
            },

        });

        // Save the movie data to MongoDB
        await movie.save();

        res.status(201).json({ message: 'Movie added successfully' });
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// fetch the data to dashboard
router.get('/moviefetch', async (req, res) => {
    try {
        const movies = await Movie.find();
        res.status(200).json(movies);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});

// get the movie details by id
// Route to fetch movie details by id

router.get('/moviedetails/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let data = await Movie.findById(id);
        res.set('Cache-Control', 'no-store');
        console.log(data);
        res.json({ data: data, status: 200 }).status(200);
    } catch (error) {
        res.status(400).json({ message: 'GET request cannot be completed' });
    }
});

// edit the movie details buy admin

router.put("/editdetails/:id", async (req, res) => {
    try {
        let id = req.params.id;
        let updateData = { $set: req.body };

        const updated = await Movie.findByIdAndUpdate(id, updateData);
        console.log(updated)
        res.set('Cache-Control', 'no-store');
        res.json({ message: "UPDATE Successful", status: 200 });
    } catch (error) {
        res.status(400).json("Cannot UPDATE data");
        console.log(`Cannot POST data`);
    }
});

// delete a movie
router.delete("/deletemovies/:id", async (req, res) => {
    try {
        let id = req.params.id;
        console.log(id);
        let data = await Movie.findByIdAndRemove(id);
        res.set('Cache-Control', 'no-store');
        res.json({ data: data, status: 200 }).status(201);
    } catch (error) {
        res.status(400).json({ message: "DELETE request cannot be completed" });
    }
});

router.post('/addreview', async (req, res) => {
    try {
        const { movieId, reviewText } = req.body;

        // Check if the movie exists
        const movie = await Movie.findById(movieId);

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Create a new review document
        const review = new MovieReview({
            movieId,
            reviewText,
        });

        await review.save();
        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a new route to fetch reviews by movie ID
router.get('/reviews/:movieId', async (req, res) => {
    try {
        const movieId = req.params.movieId;

        // Find all reviews for the specified movie
        const reviews = await MovieReview.find({ movieId });

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route to book a ticket
router.post('/bookticket', async (req, res) => {
    try {
        const { movieId, seatNumber, username, name, moviename, time, screen } = req.body;

        // Check if the seat is available
        const isSeatAvailable = await checkSeatAvailability(movieId, seatNumber, username, name);

        if (!isSeatAvailable) {
            return res.status(400).json({ error: 'Seat is not available' });
        }

        // Create a new booking
        const booking = new BookedTicket({
            movieId,
            seatNumber: seatNumber,
            username: username,
            name: name,
            moviename,
            time,
            screen,
        });

        // Save the booking to MongoDB
        await booking.save();

        // Send a success email to the user
        const mailOptions = {
            from: 'mail.tktmaster@gmail.com',
            to: username, // Use the user's email address here
            subject: 'Your Tickets',
            text: `Hi ${name},\n\nYour booking for the movie ${moviename} at ${time}, on Screen ${screen}, with Seat No. ${seatNumber} has been booked successfully.\n\nEnjoy the show!\nTicket Master\n+91 123 456-7890`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(201).json({ message: 'Ticket booked successfully' });
    } catch (error) {
        console.error('Error booking ticket:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Function to check seat availability
async function checkSeatAvailability(movieId, seatNumber, username, name, moviename, time, screen) {
    try {


        console.log('Checking seat availability for:', movieId, seatNumber, username, name, moviename, time, screen);
        // Assuming you have a 'bookings' collection in your MongoDB
        // You can customize this query based on your actual schema

        const booking = await BookedTicket.findOne({ movieId, seatNumber, username, name });
        console.log('Booking:', booking);
        // If a booking exists for the specified movie and seat, it's not available
        if (booking) {
            return false;
        }

        // If no booking exists, the seat is available
        return true;

    } catch (error) {
        console.error('Error checking seat availability:', error);
        return false; // Assume the seat is not available in case of an error
    }
}


// Add a new route to get the list of sold seats for a specific movie
router.get('/soldseats/:movieId', async (req, res) => {
    try {
        const movieId = req.params.movieId;

        // Fetch the list of sold seats for the specified movie
        const soldSeats = await getSoldSeatsForMovie(movieId);

        res.status(200).json(soldSeats);
    } catch (error) {
        console.error('Error fetching sold seats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to get sold seats for a specific movie
async function getSoldSeatsForMovie(movieId) {
    try {
        // Assuming you have a 'bookings' collection in your MongoDB
        // You can customize this query based on your actual schema
        const soldSeats = await BookedTicket.find({ movieId }).distinct('seatNumber');
        return soldSeats;
    } catch (error) {
        console.error('Error fetching sold seats:', error);
        return []; // Return an empty array in case of an error
    }
}

router.get('/booked-tickets', async (req, res) => {
    try {
        const bookedTickets = await BookedTicket.find();
        res.status(200).json(bookedTickets);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch booked tickets' });
    }
});


router.get('/user-tickets/:user', async (req, res) => {
    try {
        const user = req.params.user;
        const userTickets = await BookedTicket.find({ username: user });
        res.status(200).json({ data: userTickets });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user tickets' });
    }
});

router.get('/my-tickets/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const myTickets = await BookedTicket.find({ username: username });
        res.status(200).json({ data: myTickets });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user tickets' });
    }
});

router.delete('/deletetickets/:ticketId', async (req, res) => {
    try {
        let ticketId = req.params.ticketId;
        console.log(ticketId);
        let deleteTickets = await BookedTicket.findByIdAndRemove(ticketId);
        res.set('Cache-Control', 'no-store');
        if (!deleteTickets) {
            // Ticket not found
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: "DELETE request cannot be completed" });
    }
})


module.exports = router;