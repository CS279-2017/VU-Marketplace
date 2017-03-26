/**
 * Created by chris on 2/20/2017.
 */

'use strict';

let express         = require('express'),
    bodyParser      = require('body-parser'),
    logger          = require('morgan'),
    _               = require('underscore'),
    session         = require('express-session'),
    mongoose        = require('mongoose'),
    fs              = require('fs'),
    multiparty      = require('connect-multiparty'),
    multipartyMiddleware = multiparty();

const User = require('./db').User;
const Post = require('./db').Post;


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


//***********************************API********************************************************************

//https://github.com/danialfarid/ng-file-upload/wiki/Node-example
// https://www.npmjs.com/package/connect-multiparty
// app.post('/v1/user/uploads', multipartyMiddleware, function(req,res){
//     console.log("here bitch");
//     console.log(req.body);
// });

//POST post a new post
//Create a new post and save it
//Posts must have TITLE, TAG, VUNETID, DESCRIPTION, and PRICE
app.post('/v1/user/:vunetid', multipartyMiddleware,function (req, res) {

    //TODO: https://gist.github.com/aheckmann/2408370
    let post = req.body;
    if (!post || !post.title || !post.vunetid || !post.price || !post.description || !post.tag) {
        res.status(400).send({ error: 'title, owner, description, tag, and price are required' });
    } else {
        // Create the Post in the database
        new Post(post).save((err, post) => {
            if (err) {
                console.error(err);
                res.status(400).send({error: 'Error creating Post'});
            } else {
                //SUCCESS
                console.log(post);
                res.status(201).send({
                    //TODO:send back JSON stuff if need be
                })
            }
        });
    }
});








//PUT update a user
//Update/edit user information in their userSchema
app.put('/v1/user/:username', function (req, res) {

    //TODO: sessions
    // if (req.session.username !== req.params.username) {
    //     return res.status(401).send({ error: 'unauthorized' });
    // }

    User.findOne({username: req.params.username}, (err, user) => {
        if (err || !user) {
            console.error(err);
            res.status(404).send({ error: 'Error editing user' });
        } else {
            for (let prop in req.body) {
                user[prop] = req.body[prop];
            }

            user.save(err => {
                if (err) {
                    console.error(err);
                    res.status(400).send({error: 'Error editing user'});
                } else {
                    //TODO: update session info if needed
                    // // User could have changed their username/password, so update session info
                    // req.session.username = req.body.username;
                    // req.session.primary_email = req.body.primary_email;
                    res.status(200).send();
                }
            });
        }
    });
});

//PUT update posts
//Update or edit posts from a user
//Username is VUnet id
app.put('/v1/user/username/:post', function (req, res) {
    Post.findOne({username: req.username}, (err, post) => {
        if (err || !post) {
            console.error(err);
            res.status(404).send({ error: 'Error editing user' });
        } else {
            for (let prop in req.body) {
                post[prop] = req.body[prop];
            }

            post.save(err => {
                if (err) {
                    console.error(err);
                    res.status(400).send({error: 'Error editing user'});
                } else {
                    //TODO: update session info if needed
                    // // User could have changed their username/password, so update session info
                    // req.session.username = req.body.username;
                    // req.session.primary_email = req.body.primary_email;
                    res.status(200).send();
                }
            });
        }
    });
});

//GET user information
//Get data from the user's userSchema
//username is VUnet ID
app.get('/v1/user/:username', function (req, res) {
    User.findOne({'username': req.params.username}, (err, user) => {
        if (err) {
            res.status(401).send({error: 'unable to find user'});
        } else {
            res.status(200).send(user);
        }

    });
});

//GET user POSTS
//Receive all posts from a single user
app.get('/v1/user/:vunetid/posts', function (req, res) {
        Post.find({'vunetid': req.params.vunetid}, (err, posts) => {
            if (err) {
                res.status(401).send({error: 'unable to find posts'});
            } else {
                res.status(200).send(posts);
            }
        });
});


//GET ALL POSTS
//Receive all posts
app.get('/v1/posts', function (req, res) {
    Post.find({},(err, posts) => {
        if (err) {
            res.status(401).send({error: 'unable to find posts'});
        } else {
            res.status(200).send(posts);
        }
    });
});

//GET POST BY ID
//Receive all posts
app.get('/v1/posts/:id', function (req, res) {
    Post.find({_id: req.params.id},(err, post) => {
        if (err) {
            res.status(401).send({error: 'unable to find posts'});
        } else {
            res.status(200).send(post);
        }
    });
});

//POST user session
//Creates new user session
app.post('/v1/session/:username', function (req, res) {

});

//DELETE post
app.post('/v1/user/username/:post', function (req, res) {
    if(!req.body._id){ //TODO: REPLACE WITH POST ID
        res.status(400).send({error: 'username required'})
    }else{
        let post_id = req.body._id.toLowerCase();
        Post.find({ _id: post_id }).remove().exec();
        res.status(200).send('post deleted');
    }
});







//Start the server
let server = app.listen(8080, function () {
    console.log('Example app listening on ' + server.address().port);
});
