var express = require('express');
var bodyParser = require('body-parser')
var nodemailer = require('nodemailer');

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
        registerVerificationCode('fhF6GC', "bowenjin", "chocho513", "chocho513", "bowen.jin@vanderbilt.edu", function(){
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


function Listing(id, user, title, description, location, creation_time, expiration_time, price, buy){
    //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
    if(arguments.length == 8) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.description = description;
        this.location = location;
        this.creation_time = creation_time;
        this.expiration_time = expiration_time;
        this.price = price;
        this.buy = buy;
        this.transaction_id = null;
    }
        //Listing()
    else if(arguments.length == 0){
        //create an empty listing
    }
        //Listing(id)
    else if(arguments.length == 1){
        //get argument from database, get listing with the id
    }


}

Listing.prototype = {
    constructor: Listing,
}

function ActiveListings(){
    this.listings = []
}

//always create transaction before deleting listing
ActiveListings.prototype = {
    constructor: ActiveListings,
    add: function(listing) {
        this.listings.add(listing);
    },
    delete: function(index){
        //add transaction to Transactions table in db
        this.listings.splice(index, 1);

    }
}

//do not include password in User object, use password only to retrieve from database on login
function User(username, password, email){
    //TODO: find way to get a unique id that we can then assign the user, probably have to get it by querying the Database
    //this.id (assigned after inserting into database)
    this.username = username;
    this.password = password;
    this.email = email
    this.venmo_id = null;
    //TODO:
    //should user store a history of all the transactions and listings or should he/she just query the database?
    //Note: we want to minimize number of database queries, only use database as backup storage incase server crashes
    this.current_transactions_ids = [];
    this.all_transaction_ids = [];
    // this.all_listing_ids = [];

    this.current_location = null; // not saved onto db
    this.logged_in = null; //not saved onto db
}

User.prototype = {
    //TODO: add getters for username and email, note: password should never be gotten only used internally in a user object
    constructor: User,
    //initUserFromDatabase initializes a user object based on an object returned from database
    initUserFromDatabase: function(user){
        this._id = user._id;
        this.username = user.username;
        this.password = user.password;
        this.venmo_id = user.venmo_id;
        this.current_transactions_ids = user.current_transactions_ids
        this.all_transaction_ids = user.all_transaction_ids;
        this.current_location = user.current_location;
    },
    setVenmoId: function(venmo_id){
        this.venmo_id = venmo_id;
        //some function that does an update in the db in table Users
    },
    setCurrentLocation: function(location){
        this.current_location = location;
    },
    getTransactionHistory: function(){
        //TODO:
        //query database for all transactions involving the user
        //use all_transaction_ids
    },
    makeListing: function(id, title, description, location, expiration_time, price, buy){
        var creation_time = new Date(); //should we use Date? Can date we converted to JSON and then converted back to date?
        // how should we determine id of new listing? should we pass it in as a parameter?
        return new Listing(id ,this.username, title, description, location, creation_time, expiration_time, price, buy)
        //location might have to be modified into appropriate structure
    },
    makeTransaction:function(listing){
        //TODO:
        //make create a transaction and add it to activeTransactions
        var user_buy = null;
        var user_sell = null;
        if(this == listing.user){
            //user cannot make a transaction with his or her own listing
            throw user.username + " cannot make a transaction from his/her own listing";
        }
        else{
            if(listing.buy == true){
                user_buy = listing.user;
                user_sell = this;
            }
            else if(listing.buy == false){
                user_buy = this;
                user_sell = listing.user;
            }
            else{
                throw "buy parameter of listing with id " + listing.id + "must be true or false"
            }
        }
        var transaction = new Transaction(listing.id, user_buy, user_sell, listing);
        listing.transaction_id = transaction.id;
        return transaction;
        //update transaction_id in listing with new transaction_id
        //note we only store successful transactions, thus we delay pushing transaction to database until it has completed

    },
    initiateTransaction: function(transaction, willInititate){
        //TODO:
        //maybe add transaction_id to current_transactions of user, as well as all_transactions,
        //notify other user that someone has selected their listing
        transaction.initiate(this, willInititate);
    },
    removeTransaction: function(transaction_id){
        var index = this.current_transactions_ids.indexOf(transaction_id);
        if(index > -1){
            this.current_transactions_ids.splice(index, 1);
        }
    }
}

//TODO: login/logout simply manipulates ActiveUsers, note current user object manipulation all revolve around username
//TODO: may want to change focus to something else, may even want to remove usernames all together and only use real names
//contains all active (online) users
function ActiveUsers(){
    this.users = {};
    this.max_id = -1;
}
//TODO:change from indexing by username to indexing by _id
ActiveUsers.prototype = {
    constructor: ActiveUsers,
    add: function(user){
        if(this.users[user.username] == undefined) {
            this.users[user.username] = user;
            console.log(this.users[user.username].username + "has been added to ActiveUsers");
        }
        else{
            throw "user is already logged in, can't login"
        }

    },
    get: function(username){
        return this.users[username];
    },
    remove: function(username){
        if(this.users[username] != undefined){
            delete this.users[username]
            if(this.users[username] == undefined) {
                console.log(username + " has been removed from ActiveUsers");
            }
            else{
                throw "removing " + username + " failed";
            }
        }
        else{
            throw "user is not logged in, can't logout"
        }
        //we don't delete from database, because database keeps track of all registered users
    },
}

//TODO:
//transaction is saved to database when it has been terminated
//note create the transaction before deleting a listing
//note if we had to recreate transaction object from database, we would need a parameter for conversation as well
function Transaction(id, user_buy, user_sell, listing){
    this.id = id;
    this.user_buy = user_buy; //convert to json and save to database
    this.user_sell = user_sell; //convert to json and save to database
    this.conversation = new Conversation(); //convert to json and save to database
    this.listing = listing; //convert to json and then save to database
    this.user_buy_initiate = null; //not added to database
    this.user_sell_initiate = null; // not added to database
    this.user_buy_confirm_meet_up = false; //not added to database
    this.user_sell_confirm_meet_up = false; //not added to database
    //if both initiates are true then that means transaction is active,
    //if both confirms are not null that means transaction is then deactivated
}

Transaction.prototype = {
    constructor: Transaction,
    sendMessage: function(text, username){
        //sends a message to the current conversation
        //current_transaction cannot be null
        if(this.conversation == null){
            throw "tried to send message to null Conversation";
        }
        //(Message(text, username, time_sent)
        var message = new Message(text, username, new Date());
        this.conversation.send_message(message);
    },
    initiate: function(user, willInitiate){
        //this prevents the intitiate state from being changed after both buyer and seller have confirmed
        if(user_buy_initiate != true || user_sell_initiate != true){
            if(user == this.user_buy){
                this.user_buy_initiate = willInitiate;
            }
            else if(user == this.user_sell){
                this.user_sell_initiate = willInitiate;
                //send notification to buyer
            }
            else{
                throw "user does not match user_buy or user_sell for this Transaction"
            }
            if(user_buy_initiate == false){
                //end transaction and notify both user_buy and user_sell that transaction was terminated by buyer
                //or just notify user_sell, still unsure
            }
            else if(user_sell_initiate == false){
                //end transaction and notify both user_buy and user_sell that transaction was terminated by seller
                //or just notify user_buy, still unsure
            }
            else if(user_buy_initiate == true && user_sell_initiate == true){
                //send out a message that makes both users enter into the transaction, i.e initiate transaction
            }
        }
    },
    terminate: function(){
        //TODO:
        //remove the transaction from the ActiveTransactions (that is the only reference to transaction)
        //remove the transaction's transaction id from both users of the transaction's current transactions
        if(this.id != null) {
            this.user_buy.removeTransaction(this.id);
            this.user_sell.removeTransaction(this.id);
        }
    },
}

//current active transactions, adds a transaction to database when it is removed from active transactions
function ActiveTransactions(){
    this.transactions = {};
}

ActiveTransactions.prototype = {
    constructor: ActiveTransactions,
    add: function(transaction){
        active_transactions[transaction.id] = transaction;
        //TODO:
        //Add transaction to database
    },
    remove: function(transaction_id){
       delete active_transactions[transaction_id];
        //TODO:
        //update transaction in database to make inactive
    },
    get: function (transaction_id){
        return active_transactions[transaction_id];
    }
}

function Conversation(){
    this.messages = [];
}

Conversation.prototype = {
    constructor: Conversation,
    send_message: function(message){
        this.messages.push(message);
    },
    convertToJSON: function(){
        return JSON.stringify(this, function( key, value) {
            if(key == 'messages') {
                var ret = [];
                for(var message in this.messages){
                    ret.push(messages.converToJSON())
                }
            }
            else{
                return value;
            }
        });
    }
}

function Message(text, username, time_sent){
    this.text = text;
    this.username = username; //must be username rather than user to avoid circular reference
    //if we ever need the user's info we can look up the user using this username;
    this.time_sent = time_sent;
}

Message.prototype = {
    constructor: Message,
    converToJSON: function(){
        return JSON.stringify(this, function( key, value) {
            if (key == 'user') {
                return user.convertToJSON();
            } else{
                return value;
            }
        });
    }
}

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
                db.close()
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
            error_handler('Unable to connect to theserver. Error:' +  err);
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
                        callback(username + " with email address " + email_address + " has been registered");
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
                    console.log("updated registered to true");
                    collection_users.insert(user, function (err, result) {
                        if (err) {
                            error_handler(err);
                            return;
                        } else {
                            console.log('Inserted ' + user.username + ' into database');

                        }
                        callback();
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
                user.initUserFromDatabase(docs[0]);

                console.log("User Object: ")
                console.log(user);
                try {
                    active_users.add(user);
                }catch(error){
                    error_handler(error.message);
                    return;
                }
                console.log(user.username + "is logged in");
                // //TODO: notify user that they've been logged in
                //update user to logged in db, or maybe not don't know if it is necessary
                if(callback != undefined){ callback(); }

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
                    active_users.remove(user.username);
                }catch(e){
                    error_handler(e.message);
                    return;
                }
                console.log(user.username + "has logged out");
                // //TODO: notify user that they've been logged out
                //update user to logged in db, or maybe not don't know if it is necessary
                if(callback != undefined){ callback(); }

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