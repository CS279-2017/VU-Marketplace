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

var exports = module.exports = {};
exports.closeServer = function(){
    server.close();
};
exports.registerEmail = registerEmailAddress;
exports.registerVerificationCode = registerVerificationCode;
exports.login = login;
exports.logout = logout;
exports.makeListing = makeListing;
exports.removeListing = removeListing;
exports.getActiveUsers = getActiveUsers;
exports.getActiveListings = getActiveListings;
exports.getActiveTransactions = getActiveTransactions;

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
    //Router Method Header: register_email_address(email_address)
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

    //Router Method Header: register_verification_code(verification_code, username, password, confirm_password, email_address)
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

        //Router Method Header: login(username, password)
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
    //Router Method Header: logout(user_id, password)
    //logs user out, if username and password are correct, remove the user from active_users
    else if(req.body.command == 'logout'){
        var json = req.body.json;
        var user_id = json.user_id;
        var password = json.password;

        function callback(){

        }
        //TODO: write proper error_handler
        function error_handler(){
            console.log(e.message);
        }
        logout(user_id, password, callback, error_handler);
    }

        //Router Method Header: make_listing(user_id, password, title, description, location, expiration_time, price, buy)
    else if(req.body.command == 'make_listing'){
        var json = req.body.json;
        var user_id = json.user_id;
        var password = json.password;
        var title = json.title;
        var description = json.description;
        var location = json.location;
        var expiration_time = json.expiration_time;
        var price = json.price;
        var buy = json.buy;
        function error_handler(){
            console.log(e.message);
        }
        function callback(listing_id){

        }
        makeListing(user_id, password, title, description, location, expiration_time, price, buy, callback, error_handler);
    }
    else if(req.body.command == 'remove_listing'){
        
    }
    //initiate_transaction_request:
    //1. make the transaction
    //2. send transaction_request to user who owns the listing
    //3. await response from user
    else if(req.body.command == 'initiate_transaction_request'){
        var json = req.body.json;
        var user_id = json.user_id;
        var password = json.password;
        function error_handler(){
            console.log(e.message);
        }
        function callback(){

        }
        initiateTransactionRequest(user_id, password, callback, error_handler)
    }
    else if(req.body.command == 'accept_transaction_request'){
        
    }
    else if(req.body.command == 'decline_transaction_request'){

    }
    else if(req.body.command == 'confirm_transaction'){

    }
    else if(req.body.command == 'reject_transaction'){

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
        // registerVerificationCode('One6Tl', "bowenjin", "chocho513", "chocho513", "bowen.jin@vanderbilt.edu", function(){
        //     console.log("Verification code registration complete, now trying to login");
        //     login("bowenjin", "chocho513");
        // },
        // function(error){
        //    console.log(error);
        // });
        // login("bowenjin", "chocho513", function(){
        //     logout("bowenjin", "chocho513");
        // },function(error){
        //     console.log(error);
        // });
    }catch(e){
        console.log(e.message);
    }
});

//THE BELOW METHODS ARE API METHODS THAT USERS CALL ON THE SERVER

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
                    // else{
                    //     collection.remove({email_address: email_address}, function(err, result) {
                    //         if (err) {console.log(err);}
                    //         console.log("Successfully removed entry with email_address = " + email_address);
                    //     });
                    // }
                }
                //adds the verification code and email to db
                insertVerificationCode();
                //TODO: For testing purposes, dont actually send emails!
                // sendEmail(email_address, verification_code);
            });
            //email address, verified, registered, verification_code
            //generate a random verification code

            function insertVerificationCode(){
                //TODO: add a number of attempts that gets incremented everytime an attempt is wrong, once a certain number is reached
                //TODO: delete the entry
                var email = {email_address: email_address, registered: false, verification_code: verification_code}
                //adding unique index on email_address ensures no duplicate email_addresses
                //TODO: add something that translates the duplicate error into a more user friendly message
                collection.ensureIndex({email_address: 1}, {unique:true}, function(){
                    collection.update({email_address: email_address}, email, {upsert: true}, function (err, result) {
                        if (err) {
                            if(err.message.indexOf('duplicate key error') >= 0){
                                error_handler('username has been taken, cannot register ' + user.username);
                            }
                            else {
                                error_handler(err);
                            }
                            return;
                        } else {
                            console.log('Inserted verification code '+verification_code+' into the email db under email address '+email_address);
                            if(callback != undefined){ callback(verification_code, email_address);}
                        }
                        db.close();
                    });
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
                });
            }
        });
        return verification_code;
    }
    //notify client that verification email has been sent (client moves to text page with verification code username and password)
    //TODO:return message that indicates validation of email was successful
    return true;
}

//TODO: this causes a race condition is two users registerVerification code within about .5 seconds of each other
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
            collection_users.createIndex({ "username": 1 , unique: true });
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
                    //adding unique index on usernames makes sure no duplicate usernames will be inserted
                    //TODO: add something that translates the duplicate error into a more user friendly message
                    collection_users.createIndex({username: 1}, {unique: true}, function(){
                        console.log("updated registered to true");
                        collection_users.insert(user, function (err, result) {
                            if (err) {
                                if(err.message.indexOf('duplicate key error') >= 0){
                                    error_handler('username has been taken, cannot register ' + user.username);
                                }
                                else{
                                    error_handler(err);
                                }
                                return;
                            } else {
                                console.log('Inserted ' + user.username + ' into user database');

                            }
                            callback(); //return username, password, and email_address of user that's been registered for testing purposes
                        });
                        db.close(); //we close the db in the callback of the last database operation is performed
                    })
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

function logout(user_id, password, callback, error_handler){
    console.log("logout called");
    //verify credentials of user calling logout
    MongoClient.connect(url, function (err, db) {
        if (err) { console.log('Unable to connect to the mongoDB server. Error:', err); }
        var collection = db.collection('users');
        collection.find({_id: user_id, password: password}).toArray(function(err, docs) {
            if(docs.length > 0) {
                //TODO:
                var user = docs[0];
                //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                // console.log("user Object:");
                // console.log(user);
                try {
                    // var user_id = user._id;
                    // console.log("active_user inside logout:")
                    // console.log(active_users);
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
                error_handler("invalid user_id/password");
            }
        });
    });
}

//check active_users using user_id key, check if password matches password of the user, if so call callback,
//passes user object from active_users with user_id to the callback method
// otherwise call error_handler
function authenticate(user_id, password, callback, error_handler){
    var user = active_users.get(user_id);
    console.log("trying to authenticate user_id: " + user_id + " password: " + password);
    console.log("user: ");
    console.log(user);
    if(user == undefined){
        error_handler("tried to authenticate an invalid user_id/password combination");
    }
    else if(user.getPassword() != password){
        error_handler("tried to authenticate an invalid user_id/password combination");
    }
    else{
        console.log("authentication success!!")
        callback(user);
    }
}

//1. first authenticate if successful then create a listing,
//2. add listing to database,
//3. add listing to active_listings
//4. add listing_id to user's current_listings
//4. notify all that a new listing has been added 
function makeListing(user_id, password, title, description, location, expiration_time, price, buy, callback, error_handler){
    authenticate(user_id, password, function(user){
        var new_listing = new Listing(user_id, title, description, location, expiration_time, price, buy);
        MongoClient.connect(url, function (err, db) {
            if (err) {
                error_handler('Unable to connect to the mongoDB server. Error:' + err);
                return;
            }
            var collection_listings = db.collection('listings');
            collection_listings.insert(new_listing, function (err, count, status) {
                if(err){error_handler(err.message);}
                else{
                    collection_listings.find(new_listing).toArray(function(err, docs){
                        if(docs.length == 1){
                            new_listing.initFromDatabase(docs[0]);
                            try {
                                active_listings.add(new_listing);
                                user.addCurrentListingId(new_listing._id); //adds the new listing_id to user's current_listings
                            }catch(e){error_handler(e.message)};
                            if(callback != undefined){ callback(new_listing._id);}
                        }
                        else{
                            error_handler("more than 1 listing inserted into db");
                            return;
                        }
                    });
                }
            });
        });
    }, error_handler)
}

//1. authenticate if not successful pass message to error_handler
//2. get listing from active_listings using listing_id, if not found pass message to error handler
//3. if user_id of listing matches user_id, then remove listing from active_listings
//4. remove listing_id from user's current listings
//5. add listing_id to user's previous_listings
//5. notify all that a listing has been removed
function removeListing(user_id, password, listing_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var listing = active_listings.get(listing_id);
        if(listing.user_id == user_id){
            active_listings.remove(listing_id);
            user.removeCurrentListingId(listing_id); //does this remove it for the user object in active_users? test for this
            user.addPreviousListingId(listing_id);
            if(callback != undefined){
                callback(listing_id);
            }
        }
        else{
            error_handler("user_id doesn't match user_id of user who created the listing, unable to delete listing");
        }
    }, error_handler);
}


//makes a transaction from a listing and sends a transaction_request to the owner of the listing
//adds transaction to the current_Transaction of initator

function initiateTransactionRequest(user_id, listing_id, callback, error_handler){
    makeTransaction(user_id, listing_id, function(transaction_id){
        var listing = active_listings[listing_id]; //note the listing still exists since transaction hasn't been accepted
        var user_id_request_recipient = listing.user_id;
        sendTransactionRequest(user_id_request_recipient, function(){
            callback();
        }, error_handler);
    }, error_handler)

    //sends a transaction request to the user_id
    //TODO: implement this method
    function sendTransactionRequest(user_id, callback){

    }

    //called on a user (using user_id) and a listing (using listing_id)
//1. authenticate, if successful proceed; else return message to error_handler ("invalid authentication info")
//2. get listing from active_listings, if null then return message to error_handler
//3. check to make sure that the user_id on listing isn't the user_id intiating the transaction (can't have transaction with self)
//4. if transaction is of type buy then user_id is user_id_sell else user_id_buy
//5. create a transaction from the listing, add the database, (get _id), and then add to active_transactions
    //6. add the transaction_id of new transaction to the user who initiated
    function makeTransaction(user_id, listing_id, callback, error_handler){
        authenticate(user_id, password, function(user){
            var new_transaction = createTransactionFromListing(user_id, listing_id);
            addTransactionToDatabase(new_transaction, function(new_transaction){
                try {
                    active_transactions.add(new_transaction);
                    user.addCurrentTransactionId(transaction_id); //adds transaction_id to user that initiates
                    //user object is returned by authenticate
                }catch(e){error_handler(e.message)};
                if(callback != undefined && callback != null){
                    callback(new_transaction._id);
                }
            });
        },error_handler)

        function createTransactionFromListing(user_id, listing_id){
            var listing = active_listings.get(listing_id);
            if(listing == undefined){
                error_handler("makeTransaction: no listing found with listing_id "+listing_id);
                return;
            }
            var user_id_buy;
            var user_id_sell;
            if(listing.buy == true){
                user_id_sell = user_id;
                user_id_buy = listing.user_id;
            }
            else{
                user_id_sell = listing.user_id;
                user_id_buy = user_id;
            }
            return new Transaction(user_id_buy, user_id_sell, listing_id);
        }

        function addTransactionToDatabase(new_transaction, callback){
            MongoClient.connect(url, function (err, db) {
                if (err) {
                    error_handler('Unable to connect to the mongoDB server. Error:' + err);
                    return;
                }
                var collection_transactions = db.collection('transactions');
                collection_transactions.insert(new_transaction, function (err, count, status) {
                    if(err){error_handler(err.message);}
                    else{
                        collection_transactions.find(new_listing).toArray(function(err, docs){
                            if(docs.length == 1){
                                new_transaction.initFromDatabase(docs[0]);
                                if(callback != undefined){ callback(new_transaction);}
                            }
                            else{
                                error_handler("more than 1 transaction inserted into db");
                                return;
                            }
                        });
                    }
                });
            });
        }
    }
}


//1. authenticate, if successful proceed, else return message to error_handler ("invalid authentication_info")
//2. get transaction from active_transactions using transaction_id,
// if null then return "invalid transaction_id, unable to find transaction" to error_handler
//3. verify that user_id matches the user_id of the user that hasn't initiated yet,
//else send message to error handler "user_id doesn't match the user_id's of the transaction, user isn't part of transaction"
//4. verify that that the other user has initiated
//else send message to error handler "the other user has yet to initiate"
//5. set the accept_request boolean that corresponds to the user_id to true
//6. if listing already has a transaction_id throw error, because listing has already been accepted
//6. set _id of transaction to transaction_id of listing,
//7. update listing in database
//8. remove listing from active_listings
//9. adds transaction to accepting user's current transactions (the initiating user already has the transaction)
//10. send a message to both users that transaction has begun
function acceptTransactionRequest(user_id, password, transaction_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        if(transaction == null || transaction == undefined){
            error_handler("unable to find transaction with transaction_id: " + transaction_id);
            return;
        }
        try {
            transaction.acceptRequest(user_id);
            //throws error if user with the user_id has already accepted request or if user_id
            //doesn't match either user_id of the transactions
            //verify that the other user has already accepted_request if not throw error
        }catch(e){
            error_handler(e.message);
            return;
        }
        var listing = active_listings[transaction.listing_id];
        //throws error if transaction_id has already been set
        //or listing has already been deleted, means listing has already been accepted
        if(listing == undefined || listing.transaction_id != null){
            error_handler("user with user id " + user_id + "has already accepted another transaction for this listing");
            return;
        }
        listing.transaction_id = transaction_id; //set transaction_id to listing before updating it in database
        //TODO: update listing in database
        updateListings(listing, function(){
            active_listings.remove(transaction.listing_id);
            //add transaction to current transaction of accepting user, user object returned by authenticate
            user.addCurrentTransactionId(transaction_id);
            //send message to both users that transaction has begun
            sendTransactionStartedMessage(transaction, function(){
                callback();
            }, error_handler);
        });


    }, error_handler);

    function updateListings(listing, callback){
        MongoClient.connect(url, function (err, db) {
            if (err) {
                error_handler('Unable to connect to the mongoDB server. Error:' + err);
                return;
            }
            var collection_listings = db.collection('listings');
            collection_listings.update({_id: listing._id}, listing, function (err, count, status) {
                if(err){error_handler(err.message);}
                else{
                    if(callback != undefined && callback != null){callback();}
                }
            });
        });
    }
}

//1-4 same as acceptTransactionRequest()
//5. set the accept_request boolean that corresponds to the user_id to false
//6. update transaction in transaction database
//7. remove transaction from active_transactions
//8. message user that initiated request that their transaction has been declined
function declineTransactionRequest(user_id, password, transaction_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        if(transaction == null || transaction == undefined){
            error_handler("unable to find transaction with transaction_id: " + transaction_id);
            return;
        }
        try {
            transaction.declineRequest(user_id);
            //throws error if user with the user_id has already accepted request or if user_id
            //doesn't match either user_id of the transactions
            //verify that the other user has already accepted_request if not throw error
        }catch(e){
            error_handler(e.message);
            return;
        }
        //TODO: update transaction in database before deleting it so we have a record of the failed transaction
        updateTransaction(transaction, function(){
            //send message to user that initiated request that request was declined
            sendTransactionDeclinedMessage(transaction, function(){
                //remove transaction_id from initiating user (transaction_id was never added to declining user)
                var user_buy = active_users.get(transaction.user_id_buy);
                var user_sell = active_users.get(transaction.user_id_sell);
                if(transaction.buy == true){
                    user_sell.removeCurrentTransactionId(transaction_id);
                }
                else{
                    user_buy.removeCurrentTransactionId(transaction_id);
                }
                //remove transaction from active_transactions
                active_transactions.remove(transaction._id);
                callback();
            }, error_handler);
            
        });


    }, error_handler);

    function updateTransaction(transaction, callback){
        MongoClient.connect(url, function (err, db) {
            if (err) {
                error_handler('Unable to connect to the mongoDB server. Error:' + err);
                return;
            }
            var collection_transactions = db.collection('transactions');
            collection_transactions.update({_id: transaction._id}, transaction, function (err, count, status) {
                if(err){error_handler(err.message);}
                else{
                    if(callback != undefined && callback != null){callback();}
                }
            });
        });
    }
}


//TODO: implement sending transaction started message
function sendTransactionDeclinedMessage(transaction, callback, error_handler){
    if(transaction.buy == true){
        //TODO: send message to user_id_sell;
        callback();
    }
    else if(transaction.buy == false){
        //TODO: send message to user_id_buy
        callback();
    }
    else{
        error_handler("sendTransactionDeclinedMessage: +" +
            "user_id doesn't match either user_id of the transaction, this error should've been caught earlier");
        return;
    }

}

//TODO: implement sending transaction started message
//TODO: send a message to all the active transactions with the same listing_id to cancel
function sendTransactionStartedMessage(transaction, callback, error_handler){
    var other_transactions_with_same_listing_id = active_transactions.getTransactionsForListingId(transaction.listing_id);
    for(var i in other_transactions_with_same_listing_id){
        var other_transaction = other_transactions_with_same_listing_id[i];
        try {
            other_transaction.declineRequest();
        }catch(error){
            error_handler(error.message);
        }
        sendTransactionDeclinedMessage(other_transaction, function(){
            console.log("declined transaction with id "+other_transaction._id);
        }, error_handler)
    }
    //TODO: send message to both users of transaction that transaction has been started
    sendTransactionCompletedMessages(transaction, function(){
        callback();
    },error_handler)
}

//TODO: sends a message to both users of the transaction that the transaction has completed
function sendTransactionCompletedMessages(transaction, callback, error_handler){
    
}
//1. authenticate, same as above
//2. get transaction, same as above
//3. confirm the transaction (call confirm on the transaction), passing in user_id
//4. check if the transaction ahs completed, sendTransactionCompletedMessage To Users
//5. update transaction in database
//6. remove transaction from active_transactions
function confirmTransaction(user_id, password, transaction_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        if(transaction == undefined){
            error_handler("transaction with id " + transaction_id + " was not found");
            return;
        }
        try {
            //confirms user_id has agreed to continue with the transaction
            transaction.confirm(user_id);
        }catch(e){
            
        }
        //TODO: watch out for situation where both users confirm at the same time
        if(transaction.bothUsersHaveConfirmed() == true){
            //TODO: sendTransactionCompleted Message
            sendTransactionCompletedMessages(transaction, function(){
                
            }, error_handler);
            active_transactions.remove()
        }
    }, error_handler);
}

//1. authenticate, same as above
//2. get transaction, same as above
//3. reject the transaction (call reject on the transaction), passing in user_id
//4. check if transaction has completed, if so run appropriate methods
function rejectTransaction(user_id, password, transaction_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        if(transaction == undefined){
            error_handler("transaction with id " + transaction_id + " was not found");
            return;
        }
        try{
            transaction.reject(user_id)
        }catch(e){
            
        }
    })
}



// function recoverUsername(email_address){
//     //TODO: implement details below
//     //query User database for user with the given email address
//     //send email containing username to the email address
// }

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

function getActiveUsers(){
    return active_users;
}

function getActiveListings(){
    return active_listings;
}

function getActiveTransactions(){
    return active_transactions;
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

function sendErrorMessageToClient(){

}