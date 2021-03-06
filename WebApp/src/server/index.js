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
    path            = require('path'),
    multipartyMiddleware = multiparty();

var User = require('./db').User;
const Post = require('./db').Post;
const Account  = require('./account');
const MailerMock = require('./test/mailer-mock');
var AccountController = require('./account');
var crypt = require('crypto');
var uuID = require('node-uuid');
var UserSession = require('./user-session');
var api_response = require('./api-response');


mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error);

let app = express();
app.use(logger('combined'));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../public')));
app.use(session({
    secret: 'not a secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }
}));


//***********************************API********************************************************************

var sess;
app.get('/',function(req,res){
    // console.log(sess);
    sess=req.session;
    // console.log('after resetting: ', sess);
    if(sess.vunetid) {
        res.sendFile(path.join(__dirname, '../../public', 'listings.html'));
    }
    else {
        // console.log('sesh has no vunetid');
        res.sendFile(path.join(__dirname, '../../public', 'register.html'));
    }
});


// Handle POST to create a user session
app.post('/v1/session', function(req, res) {
    if (!req.body || !req.body.vunetid || !req.body.password) {
        res.status(400).send({ error: 'VUNetID and password required'});
    } else {
        let mailerMock = new MailerMock();
        let controller = new AccountController(User, {},{}, mailerMock);
        // window.location.href = 'listings.html';

        controller.logon(req.body.vunetid, req.body.password, function (err, apiResponse) {
            if(err){
                console.log(err);
            }else{
                if(!apiResponse.success){
                    res.status(400).send(apiResponse);
                }else{
                    sess = req.session;
                    sess.vunetid=req.body.vunetid;
                    // console.log(req.session);
                    // console.log('after logging in: ', sess);
                    res.status(201).send(apiResponse);
                    res.end('done');
                }

            }
        });
    }
        // User.findOne({vunetid: req.body.vunetid}, (err, user) => {
        //     if (err) {
        //         console.error(err);
        //         res.status(400).send({ error: 'Error signing in user [user could not be found]' });
        //     } else {
        //         if (user) {
        //             if (user == null) {
        //                 console.error(err);
        //                 res.status(400).send({ error: 'Error signing in user [user == null]' });
        //             } else if (req.body.password == user.password){
        //                 req.session.vunetid = user.vunetid;
        //                 req.session.primary_email = user.primary_email;
        //                 req.session.user_id = user._id;
        //
        //                 res.status(201).send({
        //                     vunetid:        user.vunetid,
        //                     primary_email:  user.primary_email
        //                 });
        //             } else {
        //                 res.status(400).send({error: 'Error signing in user'});
        //             }
        //         }
        //     }
        // });

});

app.post('/v1/register', function(req, res) {
    // console.log(req.body);

    var passwordSaltIn = uuID.v4(),
        cryptoIterations = 10000, // Must match iterations used in controller#hashPassword.
        cryptoKeyLen = 64,       // Must match keyLen used in controller#hashPassword.
        passwordHashIn;

    var user = new User({
        vunetid : req.body.vunetid,
        first_name : req.body.first_name,
        last_name : req.body.last_name,
        primary_email : req.body.primary_email,
        passwordHash : crypt.pbkdf2Sync(req.body.password, passwordSaltIn, cryptoIterations, cryptoKeyLen),
        passwordSalt : passwordSaltIn
    });

    let mailerMock = new MailerMock();
    let controller = new AccountController(User, {},{}, mailerMock);

    controller.register(user, function (err, apiResponse) {
        if(err){
            // console.log(err);
            res.status(400).send(apiResponse);
        }
        if (apiResponse.success){
            console.log(apiResponse.extras);
            res.status(201).send(apiResponse);
        }else{
            res.status(400).send(apiResponse);
        }

    });

});


app.post('/v1/user', function(req, res) {
    let user = req.body;
    console.log("user: " + JSON.stringify(user));
    // Ensure all required fields are included
    const hasRequiredFields = ['vunetid', 'first_name', 'last_name', 'primary_email']
        .every(property => user.hasOwnProperty(property));

    if (!hasRequiredFields) {
        return res.status(400).send({ error: 'Invalid payload' });
    }

    // // Verify the password is correct before we hash it (Mongoose does this, see db.js)
    // const LOWER_UPPER_NUM_AND_SYMBOL_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/;
    // if (user.password.length < 8 || !user.password.match(LOWER_UPPER_NUM_AND_SYMBOL_REGEX)) {
    //     return res.status(400).send({ error: 'Invalid password format' });
    // }

    // Create the User in the database
    new User(user).save((err, user) => {
        if (err) {
            console.error(err);
            res.status(400).send({ error: 'Error creating user' });
        } else {
            console.log("userCreated: " + JSON.stringify(user));
            // Add the proper session data
            req.session.vunetid = user.vunetid;
            req.session.primary_email = user.primary_email;
            req.session.user_id = user._id;

            res.status(201).send({
                vunetid: user.vunetid,
                primary_email: user.primary_email,
            });
        }
    });
});




//https://github.com/danialfarid/ng-file-upload/wiki/Node-example
// https://www.npmjs.com/package/connect-multiparty
// app.post('/v1/user/uploads', multipartyMiddleware, function(req,res){
//     console.log("here bitch");
//     console.log(req.body);
// });

//POST post a new post
//Create a new post and save it
//Posts must have TITLE, TAG, VUNETID, DESCRIPTION, and PRICE
app.post('/v1/user/:vunetid', multipartyMiddleware ,function (req, res) {

    //https://gist.github.com/aheckmann/2408370
    let post = req.body;
    let imgPath = req.files.file.path;
    post.img.data = fs.readFileSync(imgPath); //converts image to binary
    post.img.contentType = 'image/png';

    //add date
    var today = new Date();
    post.startDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
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
                console.log("Saved:" + post);
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

//GET POST BY TAG
app.get('/v1/posts/tag', function (req, res) {
    Post.find({tag: req.query.tag},(err, post) => {
        if (err) {
            res.status(401).send({error: 'unable to find posts'});
        } else {
            res.status(200).send(post);
        }
    });
});


//GET ALL POSTS
//Receive all posts
app.get('/v1/posts', function (req, res) {

    //http://stackoverflow.com/questions/22094081/how-to-get-url-value-after-question-mark-in-javascript
    let searchString = req.query.window_url;

    if(searchString.indexOf("?") > -1){
        searchString = req.query.window_url.substring(req.query.window_url.indexOf("?")+1);
        searchString =  decodeURI(searchString);
        searchString = searchString.toLocaleLowerCase();

        //https://code.tutsplus.com/tutorials/full-text-search-in-mongodb--cms-24835
        //http://stackoverflow.com/questions/39177201/not-able-to-create-index-using-mongoose
        //const find = {'$text':{'$search': searchString}};

        Post.find({ $text : { $search : searchString } },{ score : { $meta: "textScore" } })
            .sort({ score : { $meta : 'textScore' } })
            .exec(function(err, posts) {
                if (err) {
                    res.status(401).send({error: 'unable to find posts'});
                } else {
                    res.status(200).send(posts);
                }
            });

    }else{
        Post.find({},(err, post) => {
            if (err) {
                res.status(401).send({error: 'unable to find posts'});
            } else {
                res.status(200).send(post);
            }
        });
    }

});

//GET POST BY ID
app.get('/v1/posts/:id', function (req, res) {
    Post.find({_id: req.params.id},(err, post) => {
        if (err) {
            res.status(401).send({error: 'unable to find posts'});
        } else {
            res.status(200).send(post);
        }
    });
});



//DELETE post
app.post('/v1/user/delete/:post', function (req, res) {
    if(!req.body._id){
        res.status(400).send({error: 'id required'})
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




