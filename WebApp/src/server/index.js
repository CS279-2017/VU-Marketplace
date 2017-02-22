/**
 * Created by chris on 2/20/2017.
 */

'use strict';

let express         = require('express'),
    bodyParser      = require('body-parser'),
    logger          = require('morgan'),
    _               = require('underscore'),
    session         = require('express-session'),
    User            = require('./db'),
    mongoose        = require('mongoose');


mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error);

let app = express();
app.use(express.static('../../public'));
app.use(logger('combined'));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }
}));


//***********************************API********************************************************************//


//POST post a new post
//Create a new post and save it
app.post('/v1/user/:post', function (req, res) {

});

//PUT update a user
//Update/edit user information in their userSchema
app.put('/v1/user/:username', function (req, res) {

});

//PUT update posts
//Update or edit posts from a user
app.put('/v1/user/username/:post', function (req, res) {

});

//GET user information
//Get data from the user's userSchema
app.get('/v1/user/:username', function (req, res) {

});

//GET user POSTS
//Receive all posts from a single user
app.get('/v1/user/username/posts', function (req, res) {

});

//POST user session
//Creates new user session
app.post('/v1/session/:username', function (req, res) {

});


//Start the server
let server = app.listen(8080, function () {
    console.log('Example app listening on ' + server.address().port);
});
