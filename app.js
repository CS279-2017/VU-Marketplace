var express = require('express');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');

//import classes
var User = require("./classes/user.js");
var Message = require("./classes/message.js");
var Transaction = require("./classes/transaction.js");
var Listing = require("./classes/listing.js");
var Conversation = require("./classes/conversation.js");

var ActiveUsers = require("./classes/active_users.js");
var ActiveListings = require("./classes/active_listings.js");
var ActiveTransactions = require("./classes/active_transactions.js");

// create reusable transporter object using the default SMTP transport
//TODO: currently using gmail, switch to mailgun for more sends per day
var transporter = nodemailer.createTransport({
    //service: 'Gmail',
    service: 'SendGrid',
    auth: {
        // user: 'mealplanapp@gmail.com', // Your email id
        // pass: 'chocho513' // Your password
        user: 'mealplanapp',
        pass: 'chocho513'
    }
});


//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = require('mongodb').MongoClient;
// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://localhost:27017/mealplanappserver';
// // Use connect method to connect to the Server

var app = express();

var registrationUserSet = {};

var exports = module.exports = {};
exports.closeServer = function(){
    server.close();
};
exports.registerEmail = registerEmailAddress;
exports.registerVerificationCode = registerVerificationCode;
exports.login = login;
exports.logout = logout;
exports.getActiveUsers = getActiveUsers;

var active_listings = null;
var active_users = null;
var active_transactions = null;

var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.post('/', function (req, res) {
    //TODO: clean req body to make sure doesn't contain any SQL injection or other threats
    //TODO: also make sure that somebody isn't spamming the server
    //verifies email address and sends the verification code
    //note the below function calls are all asynchronous and thus cannot use exceptions, because by the time the
    //exception is triggered by the asynchronous function, the original try, catch block will be out of scope
    if(req.body.command == 'register_email_address'){
        var json = req.body.json;
        var email_address = json.email_address;
        var callback = function(){};
        //TODO: write proper error_handler
        var error_handler = function(){
            console.log(e.message);
        }
        registerEmailAddress(email_address, callback, error_handler);
    }
    //once verifictation code has been received, user enters the code along with other account info to create new account
    else if(req.body.command == 'register_verification_code'){
        var json = req.body.json;
        var verification_code = json.verification_code;
        var username = json.username;
        var password = json.password;
        var confirm_password = json.confirm_password;
        var email_address = json.email_address

        var callback = function(){};
        //TODO: write proper error_handler
        var error_handler = function() {
            console.log(e.message);
        }
        registerVerificationCode(verification_code, username, password, confirm_password, email_address, callback, error_handler);
    }
        //logs user in, creates user object from an entry in the database and then adds the user object to the active_users object
        //sends the user a key that identifies their login instance, attach the key to the user object that was added to
        //active_users, that way in the future we can authenticate without querying database
    else if(req.body.command == 'login'){
        var json = req.body.json;
        var username = json.username;
        var password = json.password;
        var email_address = json.email_address

        var callback = function(){};
        //TODO: write proper error_handler
        var error_handler = function() {
            console.log(e.message);
        }
        login(username, password, callback, error_handler);

    }
    //logs user out, if username and password are correct, remove the user from active_users
    else if(req.body.command == 'logout'){
        var json = req.body.json;
        var username = json.username;
        var password = json.password;
        var email_address = json.email_address

        var callback = function(){};
        //TODO: write proper error_handler
        var error_handler = function() {
            console.log(e.message);
        }
        logout(username, password, callback, error_handler);
    }
    // res.send('POST request to the homepage');
});


var server = app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
    //TODO: whenever active_listing, active_transactions, or active_users is changed i.e add/remove is called, 
    // TODO: all users must be notified of this change
    active_listings = new ActiveListings();
    active_transactions = new ActiveTransactions();
    active_users = new ActiveUsers();

    try {
        // registerEmailAddress("bowen.jin@vanderbilt.edu", function () {
        //     console.log("Email address registration complete");
        // }, function(error){
        //     console.log(error);
        // }
        // );
        registerVerificationCode('One6Tl', "bowenjin", "chocho513", "chocho513", "bowen.jin@vanderbilt.edu", function(){
            console.log("Verification code registration complete, now trying to login");
            login("bowenjin", "chocho513");
        },
        function(error){
           console.log(error);
        });
        // login("bowenjin", "chocho513", function(){
        //     logout("bowenjin", "chocho513");
        // },function(error){
        //     console.log(error);
        // });
    }catch(e){
        console.log(e.message);
    }
});

//TODO: note we pass an error handler method to each of these methods, if the methods are called, they are passed
//TODO: a string that describes the error
function registerEmailAddress(email_address, callback, error_handler){
    //validate email address is real
    if(validateEmail(email_address) == false){
        //TODO: return a object type that has an error message
        error_handler("invalid email address");
        return;
    }
    //validate email address is vanderbilt.edu
    if(validateVanderbiltEmail(email_address) == false){
        //TODO: return a object type that has an error message
        error_handler("must be a vanderbilt.edu email address")
        return;
    }
    //TODO: implement details below
    //validate email address send out verification email
    try {
        //generates veritification code and sends out email containing the code to email_address
        sendVerificationEmail(email_address);
    }catch(e){
        console.log(e.message);
    }

    //returns the verification_code and asychronously adds it to the database
    function sendVerificationEmail(email_address){
        //TODO: first ensure that email address has not already been verified
        //TODO: if the email address exists but hasn't been verified delete the email address
        function makeVerificationCode(length){
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < length; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }
        var verification_code = makeVerificationCode(6);
        MongoClient.connect(url, function (err, db) {
            if (err) {
                error_handler('Unable to connect to the mongoDB server. Error:' +  err);
                return;
            }
            var collection = db.collection('emails');
            collection.find({email_address: email_address}).toArray(function(err, docs) {
                if(docs.length > 0) {
                    //if email has already been registered throw error saying email is taken
                    if(docs[0].registered == true){
                        error_handler("email address has already been registered")
                        return;
                    }
                    else{
                        collection.remove({email_address: email_address}, function(err, result) {
                            if (err) {console.log(err);}
                            console.log("Successfully removed entry with email_address = " + email_address);
                        });
                    }
                }
                //adds the verification code and email to db
                insertVerificationCode();
                sendEmail(email_address, verification_code);
            });
            //email address, verified, registered, verification_code
            //generate a random verification code

            function insertVerificationCode(){
                //TODO: add a number of attempts that gets incremented everytime an attempt is wrong, once a certain number is reached
                //TODO: delete the entry
                var email = {email_address: email_address, registered: false, verification_code: verification_code}
                collection.insert(email, function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Inserted verification code '+verification_code+' into the email db under email address '+email_address);
                    }
                    db.close();
                });
            }
            function sendEmail(email_address, verification_code){
                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: '"Meal Plan App" <mealplanapp@gmail.com>', // sender address
                    to: email_address, // list of receivers
                    subject: 'Verification Code for Meal Plan App', // Subject line
                    text: 'Verification Code: ' + verification_code, // plaintext body
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);
                    //send verification_code to callback as well as email (for testing purposes)
                    if(callback != undefined){ callback(verification_code, email_address);}
                });
            }
        });
        return verification_code;
    }
    //notify client that verification email has been sent (client moves to text page with verification code username and password)
    //TODO:return message that indicates validation of email was successful
    return true;
}


function registerVerificationCode(verification_code, username, password, confirm_password, email_address, callback, error_handler){
    console.log("called registerVerificationCode");
    //TODO: implement details below
    //verify that username is valid
    if(!validateUsername(username)){
        //TODO: return some error message
        error_handler("invalid username");
        return;
    }
    //verify password is valid
    if(!validatePassword(password)) {
        //TODO: return some error message
        error_handler("invalid password");
        return;
    }
    //verify password confirm matches password
    if(password != confirm_password){
        //TODO: return a object type that has an error message
        error_handler("password doesn't match");
        return;
    }
    //create user and add to database
    var user = new User(username, password, email_address);
    //note this action happens asynchronously, subsequent events will probably occur before callback occurs
    MongoClient.connect(url, function (err, db) {
        if (err) {
            error_handler('Unable to connect to the server. Error:' +  err);
            return;
        }
        //TODO: verify that the verification code is valid, or if user has clicked on verification link
        var collection_emails = db.collection('emails');
        //TODO: the fact that checking if registered is false and setting registered to true are not atomic operations
        //TODO:leads to possibility of race condition, though unlikely
        //register the user
        collection_emails.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length > 0) {
                //checks that verification_code is valid and email hasn't already been registered
                if(docs[0].verification_code == verification_code){
                    if(docs[0].registered == false){
                        registerUser();
                    }
                    else{
                        error_handler(email_address + " has already been registered");
                        return;
                    }
                }
                else{
                    error_handler("verification code doesn't match")
                    return;
                }
            }
            else{
                //TODO:
                error_handler("cannot register, email_address not found in emails database ")
                return;
            }
        });


        function registerUser(){
            var collection_emails = db.collection('emails');
            var collection_users = db.collection('users');
            //TODO: check to make sure that email and username are unique
            //TODO:change emails database entry to reflect that a email has been registered
            checkIfEmailAndUserNameUnique(function() {
                insertUser(function () {
                    //TODO: log user registering
                    if (callback != undefined) {
                        // callback(username + " with email address " + email_address + " has been registered");
                        callback(username, password, email_address); //used for testing purposes
                    }
                })
            });

            //TODO: should we use usernames or real names? Real Names might require integration with Facebook
            function checkIfEmailAndUserNameUnique(callback){
                if(registrationUserSet[username] != undefined){
                    error_handler(username + " has been taken");
                    return;
                }
                else{
                    registrationUserSet[username] = username;
                }
                collection_users.find({email_address: email_address}).toArray(function(err, docs) {
                    if(docs.length > 0) {
                        error_handler("email address has already been registered")
                        return;
                    }
                    else{
                        console.log(email_address + " is unique!")
                        //TODO:
                        collection_users.find({username: username}).toArray(function(err, docs){
                            if(docs.length > 0){
                                console.log(username + " has been taken");
                                error_handler(username + " has been taken");
                                return;
                            }
                            else{
                                console.log(username + " is unique!")
                                callback();
                            }
                        });
                    }
                });
            }

            function insertUser(callback){
                collection_emails.update({email_address:email_address}, {$set: {registered : true}}, function(err, result) {
                    if(err){
                        error_handler(err);
                        return;
                    }
                    console.log("updated registered to true");
                    collection_users.insert(user, function (err, result) {
                        if (err) {
                            error_handler(err);
                            return;
                        } else {
                            console.log('Inserted ' + user.username + ' into user database');

                        }
                        callback(); //return username, password, and email_address of user that's been registered for testing purposes
                    });
                    db.close(); //we close the db in the callback of the last database operation is performed
                });
            }
        }

    });

    //return something indicating all the validation of input is valid but database may still trigger error
    return true;
}

//TODO: return the id from registration and use that for future server accesses along with the password
//TODO: login with username and password or email address, or facebook?
function login(username, password, callback, error_handler){
    //TODO: implement details below
    //query database for user with given username and password
    console.log("login called");
    MongoClient.connect(url, function (err, db) {
        if (err) { console.log('Unable to connect to the mongoDB server. Error:', err); }
        var collection = db.collection('users');
        collection.find({username: username, password: password}).toArray(function(err, docs) {
            if(docs.length > 0) {
                //TODO:
                //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                var user = new User();
                user.initFromDatabase(docs[0]);

                console.log("User Object: ")
                console.log(user);
                try {
                    active_users.add(user);
                }catch(error){
                    error_handler(error.message);
                    return;
                }
                console.log(user.username + "is logged in");
                //return user._id, use this to authenticate rather than username, thus login is independent of username
                if(callback != undefined){ callback(user._id); }

            }
            else{
                //TODO:
                //if not found: alert user that login failed, because incorrect username/password
                error_handler("invalid username/password");
            }
            db.close()
        });
    });
}

function logout(username, password, callback, error_handler){
    console.log("logout called");
    //verify credentials of user calling logout
    MongoClient.connect(url, function (err, db) {
        if (err) { console.log('Unable to connect to the mongoDB server. Error:', err); }
        var collection = db.collection('users');
        collection.find({username: username, password: password}).toArray(function(err, docs) {
            if(docs.length > 0) {
                //TODO:
                var user = docs[0];
                //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                console.log("user Object:");
                console.log(user);
                try {
                    var user_id = user._id;
                    console.log("active_user inside logout:")
                    console.log(active_users);
                    //this saves the user data to the database before logging out
                    collection.update({_id:user._id}, active_users.get(user_id), function(err, result) {
                        if(err){error_handler(err);}
                        console.log(user_id + " info saved to database");
                        db.close()
                        console.log(user.username + "has logged out");
                        // //TODO: notify user that they've been logged out
                        if(callback != undefined){ callback(); }
                    });
                        //update database with new user info
                    active_users.remove(user_id);
                }catch(e){
                    error_handler(e.message);
                    return;
                }

            }
            else{
                //TODO:
                //if not found: alert user that login failed, because incorrect username/password
                error_handler("invalid username/password");
            }
        });
    });
}

// function recoverUsername(email_address){
//     //TODO: implement details below
//     //query User database for user with the given email address
//     //send email containing username to the email address
// }

function getActiveUsers(){
    return active_users;
}

function resetPassword(email_address){
    //send message back to client saying "if valid email address then you will receive a reset password at this link"
    //search database to see if valid email_address
    //if so, send email to email address containing verification link to reset
}

function resetPasswordVerification(new_password, new_password_confirm){
    //check to see if user has clicked on verification link
    //check to see if new password is valid
    //check to see if new password confirm is equal to new password
    //update the password for the user in the database (note verification code must be associated with a user)
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validateVanderbiltEmail(email){
    return /@vanderbilt.edu\s*$/.test(email);
}

function validateUsername(username){
    //username must be between 6-20 characters, can only contain alphanumeric and numbers
    //first character must be alphanumeric
    return /^[A-Za-z][A-Za-z0-9]{5,19}$/.test(username);
}

function validatePassword(password){
    //must be atleast 6 characters long
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
}