var http = require('http');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = require('mongodb').MongoClient;
// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://localhost:27017/mealplanappserver';
//database stores an instance of a connection to the database, will be initialized on server startup.
var database;

//import classes
var User = require("./classes/user.js");
var Message = require("./classes/message.js");
var Transaction = require("./classes/transaction.js");
var Listing = require("./classes/listing.js");
var Conversation = require("./classes/conversation.js");
var Location = require("./classes/location.js")
var UserInfo = require("./classes/user_info.js")
var ListingInfo = require("./classes/listing_info.js")


var ActiveUsers = require("./classes/active_users.js");
var ActiveListings = require("./classes/active_listings.js");
var ActiveTransactions = require("./classes/active_transactions.js");

//methods that are exported in module
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
exports.makeTransactionRequest = makeTransactionRequest;
exports.acceptTransactionRequest = acceptTransactionRequest;
exports.declineTransactionRequest = declineTransactionRequest;
exports.confirmTransaction = confirmTransaction;
exports.rejectTransaction = rejectTransaction;

exports.updateUserLocation = updateUserLocation;

exports.sendChatMessage = sendChatMessage;

exports.getActiveUsers = getActiveUsers;
exports.getActiveListings = getActiveListings;
exports.getActiveTransactions = getActiveTransactions;

exports.getUser = getUser;
exports.getListing = getListing;


// create reusable transporter object using the default SMTP transport
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

var active_listings = null;
var active_users = null;
var active_transactions = null;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

server.listen(3000, function () {
    console.log('Example app listening on port 3000!');
    //TODO: whenever active_listing, active_transactions, or active_users is changed i.e add/remove is called,
    // TODO: all users must be notified of this change
    active_listings = new ActiveListings();
    active_transactions = new ActiveTransactions();
    active_users = new ActiveUsers();

    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the server. Error:' + err);
            return;
        }
        database = db;
    });

    //remove all expired active_listings once a minute
    var interval = 1000;
    setInterval(function() {
        var expired_listings_arr = active_listings.getExpiredListings();
        function error_handler(e){
            console.log(e)
        }
        for(var i=0; i<expired_listings_arr.length; i++){
            var listing = expired_listings_arr[i];
            // var user = active_users.get(listing.user_id);
            // console.log(user);
            // console.log(listing);
            // console.log("Expired Listings Before Removal");
            console.log(active_listings.getExpiredListings());
            removeListing(listing._id, function(listing_id){
                // console.log("Expired Listings After Removal");
                // console.log(active_listings.getExpiredListings());
                io.emit("listing_removed", {data: {listing_id: listing_id}});
                console.log("listing with id " + listing_id + " was removed because it has expired");
            }, error_handler);
        }
    }, interval);

    try {

    }catch(e){
        console.log(e.message);
    }
});

app.get('/', function (req, res) {
    res.send('Hello World!');
});

//TODO: when a user connects check if they are logged in, if not then tell them to login, this is done on the client side
io.on('connection', function (socket) {
    console.log("user has connected!");
    socket.emit('event', { data: 'server data' });
    //TODO: should active_listings and transactions be terminated? no unless terminated by other party
    //TODO: should user be logged out when disconnected? maybe
    //log the user out on disconnect
    //send 'logged_out_due_to_disconnect' event to user
    socket.on('disconnect', function() {
        console.log('user has disconnected!');
        var socket_id = socket.id
        var disconnected_user = active_users.getUserBySocketId(socket_id);
        var error_handler = function (e) {
            console.log(e);
            return;
        }
        if(disconnected_user != null) {
            logout(disconnected_user._id, disconnected_user.password, function (user_id) {
                console.log("user with id " + disconnected_user._id + " logged out due to disconnected")
                socket.emit('logged_out_due_to_disconnect', {data: null, error: null});
            }, error_handler)
        }
    });

    socket.on('register_email_address', function(json) {
        var email_address = json.email_address.toLowerCase();
        var callback = function (verification_code, email_address) {
            socket.emit('register_email_address_response', {data: null , error: null});
        };
        var error_handler = function (e) {
            socket.emit('register_email_address_response', {data: null , error: e})
            console.log(e);
            return;
        }
        registerEmailAddress(email_address, callback, error_handler);
    });

    socket.on('register_verification_code', function(json){
        var verification_code = json.verification_code;
        // var username = json.username;
        var password = json.password;
        
        var first_name = json.first_name;
        var last_name = json.last_name;
        // var confirm_password = json.confirm_password;
        var email_address = json.email_address.toLowerCase();
        var callback = function(){
            socket.emit("register_verification_code_response", {data: {first_name: first_name, last_name: last_name}, error: null});
        };
        var error_handler = function(e) {
            socket.emit("register_verification_code_response", {data: null, error: e});
            console.log(e);
        }
        registerVerificationCode(verification_code, email_address, password, first_name, last_name, callback, error_handler);
    });

    socket.on('login', function(json){
        var email_address = json.email_address.toLowerCase();
        var password = json.password;

        var callback = function(user){
            //send user_id back to user
            //notify necessary clients that a user has logged in
            user.socket_id = socket.id; //store the socket_id of the user
            socket.emit("login_response", {data: {user_id: user._id}, error: null});
        };
        var error_handler = function(e) {
            socket.emit("login_response", {data: null, error: e});
            console.log(e);
        }
        login(email_address, password, callback, error_handler);
    });

    socket.on('logout', function(json){
        var user_id = json.user_id;
        var password = json.password;

        function callback(){
            //notify necessary clients that a sure has logged out
            socket.emit("logout_response", {data: null, error: null});
        }
        function error_handler(e){
            socket.emit("logout_response", {data: null, error: e});
            console.log(e);
        }
        logout(user_id, password, callback, error_handler);
    });


    //TODO: the following API calls may involve message queues where he receiver of the message is offline
    //TODO: or currently unavailable to respond to the message, in that case the message must be saved
    //TODO: until the receiver is ready

    //TODO: max number of listings per user?
    //tODO: multiple listings of the same title?
    socket.on('make_listing', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var title = json.title;
        var description = json.description;
        var location = json.location;
        var expiration_time = json.expiration_time;
        var price = json.price;
        var buy = json.buy;
        function callback(listing){
            socket.emit("make_listing_response", {data: null, error: null});
            //emit event to all users that a new listing has been made
            io.emit("listing_made", {data: {listing: listing}});
        }
        function error_handler(e){
            socket.emit("make_listing_response", {data: null, error: e});
            console.log(e);
        }
        makeListing(user_id, password, title, description, location, expiration_time, price, buy, callback, error_handler);
    });

    //TODO: what happens if a you try to remove a listing that transactions have been made from?
    //TODO: what about trying to remove a listing where a transaction has already started?
    socket.on('remove_listing', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var listing_id = json.listing_id
        var callback = function(listing_id){
            socket.emit("remove_listing_response", {data: {listing_id: listing_id}, error: null})
            //notify all users that listing_id has been removed
            io.emit("listing_removed", {data: {listing_id: listing_id}});
        };
        var error_handler = function(e) {
            socket.emit("remove_listing_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, function(user){
            console.log("user authenticated")
            var listing = active_listings.get(listing_id);
            console.log(listing)
            console.log(listing_id);
            if(listing.user_id.toString() == user_id.toString()){
                removeListing(listing_id, callback, error_handler)
            }
            else{
                error_handler("user_id doesn't match user_id of user who created the listing, unable to delete listing");
            }
        }, error_handler);
    });
    //initiate_transaction_request:
    //1. make the transaction
    //2. send transaction_request to user who owns the listing
    //3. await response from user

    //TODO: making a transaction from a listing that is being removed i.e no longer exists
    //TODO: making a transaction with a user that is offline or disconnected
    //TODO: multiple transactions can be made on a single listing
    //TODO: max number of transactions per user?
   socket.on('make_transaction_request', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var listing_id = json.listing_id; 
        function callback(transaction){
            //send transaction request to other user first then notify calling user of success
            try {
                //Sends message to other user that a transaction has been made on their listing
                var other_user = transaction.getOtherUser(user_id);
                var other_user_socket = io.sockets.connected[other_user.socket_id];
                other_user_socket.emit("transaction_request_made", {data: {user_id: user_id, listing_id: listing_id}, error: null})
            }catch(e){
                error_handler(e.message)
                return;
            }

            socket.emit("make_transaction_request_response", {data: null, error: null});
            //notify user that owns listing that a user has requested a transaction
        }
        function error_handler(e) {
            socket.emit("make_transaction_request_response", {data: null, error: e});
            console.log(e);
        }
        makeTransactionRequest(user_id, password, listing_id, callback, error_handler);
    });

    //TODO: accepting a transaction that's already been accepted
    //TODO: accepting a transaction request on a transaction that no longer exists (there is no request object, only a transaction object) can the other user cancel a transaction requesT?
    //TODO: max number of transactions per user?
    socket.on('accept_transaction_request', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var transaction_id = json.transaction_id;
        function callback(transaction){
            socket.emit("accept_transaction_request_response", {data: null, error: null});
            //notify users involved in the transaction that transaction has been accepted, will start
            try {
                var buyer = active_users.get(transaction.buyer_user_id);
                var seller = active_users.get(transaction.seller_user_id);
                var buyer_socket = io.sockets.connected[buyer.socket_id];
                var seller_socket = io.sockets.connected[seller.socket_id];
                buyer_socket.emit("transaction_started", {transaction: transaction});
                seller_socket.emit("transaction_started", {transaction: transaction});
            }catch(e){
                console.log(e);
                return;
            }
        }
        function error_handler(e){
            socket.emit("accept_transaction_request_response", {data: null, error: e});
            console.log(e);
        }
        acceptTransactionRequest(user_id, password, transaction_id, callback, error_handler)
    });

    //TODO: declining a transaction that no longer exists
    //TODO: declining a transaction on a listing that no longer exists (i.e has been been accepted or removed)
    //TODO: does this destroy the transaction? yes
    socket.on('decline_transaction_request', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var transaction_id = json.transaction_id;
        function callback(transaction){
            try {
                var other_user = transaction.getOtherUser(user_id);
                var other_user_socket = io.sockets.connected[other_user.socket_id];
                other_user_socket.emit("transaction_declined", {data: {transaction_id: transaction._id}, error: null})
            }catch(e){
                console.log(e);
                return;
            }

            socket.emit("decline_transaction_request_response", {data: null, error: null});
            //notify the initiator of the transaction that transaction has been rejected
        }
        function error_handler(e){
            socket.emit("decline_transaction_request_response", {data: null, error: e});
            console.log(e);
        }
        declineTransactionRequest(user_id, password, transaction_id, callback, error_handler)
    });

    //TODO: confirming a transaction that doesn't exist i.e not in active_transactions
    //TODO: confirming a transaction thats already confirmed
   socket.on('confirm_transaction', function(json){
       var user_id = json.user_id;
       var password = json.password;
       var transaction_id = json.transaction_id;
       function callback(transaction){
           //notify both users in the transaction that this user has confirmed
           try {
               var buyer = active_users.get(transaction.buyer_user_id);
               var seller = active_users.get(transaction.seller_user_id);
               var buyer_socket = io.sockets.connected[buyer.socket_id];
               var seller_socket = io.sockets.connected[seller.socket_id];
               buyer_socket.emit("transaction_confirmed", {data: {user_id: user_id, transaction_id: transaction_id}, error: null});
               seller_socket.emit("transaction_confirmed", {data: {user_id: user_id, transaction_id: transaction_id}, error: null});
               if(transaction.isCompleted()){
                   //notify users that transaction is completed
                   buyer_socket.emit("transaction_completed", {data: {transaction_id: transaction_id}, error: null});
                   seller_socket.emit("transaction_completed", {data: {transaction_id: transaction_id}, error: null});
               }
           }catch(e){
               console.log(e);
               return;
           }

           socket.emit("confirm_transaction_response", {data: null, error: null});
       }
       function error_handler(e){
           socket.emit("confirm_transaction_response", {data: null, error: e});
           console.log(e);
       }
       confirmTransaction(user_id, password, transaction_id, callback, error_handler);
   });

    //TODO: rejecting a transaction thats already been rejected
    //TODO: rejecting a transaction that doesn't exist
   socket.on('reject_transaction', function(json){
       var user_id = json.user_id;
       var password = json.password;
       var transaction_id = json.transaction_id;
       function callback(transaction){
           //notify both users in the transaction that this user has rejected the transaction
           try {
               var buyer = active_users.get(transaction.buyer_user_id);
               var seller = active_users.get(transaction.seller_user_id);
               var buyer_socket = io.sockets.connected[buyer.socket_id];
               var seller_socket = io.sockets.connected[seller.socket_id];
               buyer_socket.emit("transaction_rejected", {data: {user_id: user_id, transaction_id: transaction_id}, error: null});
               seller_socket.emit("transaction_rejected", {data: {user_id: user_id, transaction_id: transaction_id}, error: null});
           }catch(e){
               console.log(e);
               return;
           }
           socket.emit("reject_transaction_response", {data: null, error: null});
       }
       function error_handler(e){
           socket.emit("reject_transaction_response", {data: null, error: e});
           console.log(e);
       }
       rejectTransaction(user_id, password, transaction_id, callback, error_handler)
   });


    //12. update_user_location_response
    //1. tells client that their location has been successfully updated
    //*if successful update, then emit event to all clients in a transaction with this user that their location has changed
    //2. or sends error
    //TODO: trying to update a location for a user that is offline
    //TODO:
    socket.on('update_user_location', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var new_location = json.new_location;
        function callback(updated_location){
            socket.emit("update_user_location_response", {data: {updated_location: updated_location}, error: null});
            //notify all users, or all users in the same transaction with user whose location was updated,
            var user = active_users.get(user_id);
            var current_transaction_ids = user.getCurrentTransactionIds();
            try {
                for (var key in current_transaction_ids) {
                    var transaction_id = current_transaction_ids[key];
                    var transaction = active_transactions.get(transaction_id);
                    var other_user = transaction.getOtherUser(user_id);
                    var other_user_socket = io.sockets.connected[other_user.socket_id];
                    other_user_socket.emit("user_location_updated", {data: {user_id: user._id, transaction_id: transaction_id, updated_location: updated_location}, error: null});
                }
            }catch(e){
                console.log(e);
                return;
            }
        }
        function error_handler(e){
            socket.emit("update_user_location_response", {data: null, error: e});
            console.log(e);
        }
        updateUserLocation(user_id, password, new_location, callback, error_handler)
    });

    socket.on('send_chat_message', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var transaction_id = json.transaction_id;
        var message_text = json.message_text;
        function callback(message){
            socket.emit("send_chat_message_response", {data: null, error: null});
            //notify all user in the transaction that a new message has been sent
            try {
                var transaction = active_transactions.get(transaction_id);
                var buyer = transaction.buyer_user_id;
                var seller = transaction.seller_user_id;
                var buyer_socket = io.sockets.connected[buyer.socket_id];
                var seller_socket = io.sockets.connected[seller.socket_id];
                buyer_socket.emit("chat_message_sent", {data: {transaction_id: transaction_id, message: message}, error: null});
                seller_socket.emit("chat_message_sent", {data: {transaction_id: transaction_id, message: message}, error: null});
            }catch(e){
                console.log(e);
                return;
            }
        }
        function error_handler(e){
            console.log(e);
        }
        sendChatMessage(user_id, password, transaction_id, message_text, callback, error_handler)
    });

    socket.on('get_all_active_listings', function(json){
        var user_id = json.user_id;
        var password = json.password;
        function callback(all_active_listings){
            //send all_active_listings back to client
            socket.emit("get_all_active_listings_response", {data: {all_active_listings: all_active_listings}, error: null});
        }
        function error_handler(e){
            socket.emit("get_all_active_listings_response", {data: null, error: e});
            console.log(e);
        }
        getAllActiveListings(user_id, password, callback, error_handler)
    });
    
    socket.on('get_listing', function(json){
        var listing_id = json.listing_id;
        function callback(listing_info){
            //send all_active_listings back to client
            socket.emit("get_listing_response", {data: {listing_info: listing_info}, error: null});
        }
        function error_handler(e){
            socket.emit("get_listing_response", {data: null, error: e});
            console.log(e);
        }
        getListing(listing_id, callback, error_handler);
    });
    socket.on('get_user', function(json){
        var user_id = json.user_id;
        function callback(user_info){
            //send all_active_listings back to client
            socket.emit("get_user_response", {data: {user_info: user_info}, error: null});
        }
        function error_handler(e){
            socket.emit("get_user_response", {data: null, error: e});
            console.log(e);
        }
        getUser(user_id, callback, error_handler);
    });
});

//**************************************
//**BEGIN Client -> Server API methods**
//**************************************

//note each method has a callback and error_handler methods, one or the other will be called in each execution
//successful execution calls callback, unsuccessful calls error_handler

//note we pass an error handler method to each of these methods, if the methods are called, they are passed
//a string that describes the error
function registerEmailAddress(email_address, callback, error_handler){
    email_address = email_address.toLowerCase() //converts email_address to lowercase because email_addresses are case insensitive
    //validate email address is real
    if(validateEmail(email_address) == false){
        //return a object type that has an error message
        error_handler("invalid email address");
        return;
    }
    //validate email address is vanderbilt.edu
    if(validateVanderbiltEmail(email_address) == false){
        error_handler("must be a vanderbilt.edu email address")
        return;
    }
    //validate email address send out verification email
    try {
        //generates veritification code and sends out email containing the code to email_address
        sendVerificationEmail(email_address);
    }catch(e){
        console.log(e.message);
    }

    //returns the verification_code and asychronously adds it to the database
    function sendVerificationEmail(email_address){
        //first ensure that email address has not already been verified
        //if the email address exists but hasn't been verified delete the email address
        function makeVerificationCode(length){
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < length; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }
        var verification_code = makeVerificationCode(6);
        var collection = database.collection('emails');
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
            //adds the verification code and email to database
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
            collection.ensureIndex({email_address: 1}, {unique:true}, function(){
                collection.update({email_address: email_address}, email, {upsert: true}, function (err, result) {
                    if (err) {
                        if(err.message.indexOf('duplicate key error') >= 0){
                            // a friendly message that replaces the duplicate error
                            error_handler('email_address has been taken, cannot register ' + email_address);
                        }
                        else {
                            error_handler(err);
                        }
                        return;
                    } else {
                        console.log('Inserted verification code '+verification_code+' into the email database under email address '+email_address);
                        if(callback != undefined){ callback(verification_code, email_address);}
                    }
                    // database.close();
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
        return verification_code;
    }
    //notify client that verification email has been sent (client moves to text page with verification code username and password)
    //TODO:return message that indicates validation of email was successful
    return true;
}

//this causes a race condition is two users registerVerification code within about .5 seconds of each other
//fixed: by adding an index to database before inserting
function registerVerificationCode(verification_code, email_address, password, first_name, last_name, callback, error_handler){
    console.log("called registerVerificationCode");

    //adds a function to String prototype to capitalize first letter
    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
    email_address = email_address.toLowerCase(); //converts email_address to lower_case because email_addresses are case insensitive
    first_name = first_name.toLowerCase(); //converts first name to lower case
    first_name = first_name.capitalizeFirstLetter(); //then capitalizes first letter
    last_name = last_name.toLowerCase(); //converts last name to lower case
    last_name = last_name.capitalizeFirstLetter(); //then capitalizes first letter
    //verify password is valid
    if(!validatePassword(password)) {
        error_handler("invalid password");
        return;
    }
    //verify password confirm matches password
    // if(password != confirm_password){
    //     error_handler("password doesn't match");
    //     return;
    // }
    //create user and add to database
    var user = new User(first_name, last_name, password, email_address);
    //note this action happens asynchronously, subsequent events will probably occur before callback occurs
    //verify that the verification code is valid, or if user has clicked on verification link
    var collection_emails = database.collection('emails');
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
            error_handler("cannot register, email_address not found in emails database ")
            return;
        }
    });


    function registerUser(){
        var collection_emails = database.collection('emails');
        var collection_users = database.collection('users');
        //check to make sure that email and username are unique
        //change emails database entry to reflect that a email has been registered
        checkIfEmailAddressUnique(function() {
            insertUser(function () {
                //log user registering
                if (callback != undefined) {
                    callback(email_address, password); //used for testing purposes
                }
            })
        });

        function checkIfEmailAddressUnique(callback){
            collection_users.find({email_address: email_address}).toArray(function(err, docs) {
                if(docs.length > 0) {
                    error_handler("email address has already been registered")
                    return;
                }
                else{
                    callback()
                }
            });
        }

        function insertUser(callback){
            collection_users.createIndex({email_address: 1}, {unique: true}, function(){
                collection_users.insert(user, function (err, result) {
                    if (err) {
                        if(err.message.indexOf('duplicate key error') >= 0){
                            error_handler('email_address has been taken, cannot register ' + user.email_address);
                        }
                        else{
                            error_handler(err);
                        }
                        return;
                    } else {
                        console.log('Inserted ' + user.email_address + ' into user database');
                        collection_emails.update({email_address:email_address}, {$set: {registered : true}}, function(err, result) {
                            if(err){
                                error_handler(err);
                                return;
                            }
                            callback();
                        });

                    }
                });
            });
        }
    }

    //return something indicating all the validation of input is valid but database may still trigger error
    return true;
}

function login(email_address, password, callback, error_handler){
    email_address = email_address.toLowerCase();
    //query database for user with given email_address and password
    console.log("login called");
    var collection = database.collection('users');
    collection.find({email_address: email_address, password: password}).toArray(function(err, docs) {
        if(docs.length > 0) {
            //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
            var user = new User();
            user.initFromDatabase(docs[0]);
            try {
                active_users.add(user);
            }catch(error){
                error_handler(error.message);
                return;
            }
            console.log(user.email_address + " is logged in");
            //return user._id, use this to authenticate, thus login is independent of login credentials
            if(callback != undefined){ callback(user); }

        }
        else{
            //if not found: alert user that login failed, because incorrect email_address/password
            error_handler("invalid email_address/password");
        }
    });
}

//TODO: what if a user logs out during a transaction? while he/she has listings? or he or she has requested a transaction
//TODO: or when he or she has received a transaction?
function logout(user_id, password, callback, error_handler){
    console.log("logout called");
    //verify credentials of user calling logout
    authenticate(user_id, password, function(user){
        try {
            var collection = database.collection('users');
            //this saves the user data to the database before logging out
            collection.update({_id:user._id}, active_users.get(user_id), function(err, result) {
                if(err){error_handler(err); return;}
                console.log(user_id + " info saved to database");
                console.log(user.email_address + " has logged out");
                if(callback != undefined){ callback(); }
            });
                //update database with new user info
            active_users.remove(user_id);
        }catch(e){
            error_handler(e.message);
            return;
        }
    }, error_handler);
}

//check active_users using user_id key, check if password matches password of the user, if so call callback,
//passes user object from active_users with user_id to the callback method
// otherwise call error_handler
function authenticate(user_id, password, callback, error_handler){
    var user = active_users.get(user_id);
    console.log("trying to authenticate user_id: " + user_id + " password: " + password);
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
//5. notify all that a new listing has been added 

//TODO: save the listing state i.e bool called active so that upon server crash, active_listings can be restored
function makeListing(user_id, password, title, description, location, expiration_time, price, buy, callback, error_handler){
    authenticate(user_id, password, function(user){
        if(!validateTitle(title)){
            error_handler("invalid title");
            return;
        }
        if(!validateDescription(description)){
            error_handler("invalid description");
            return;
        }
        if(!validateLocation(location)){
            error_handler("invalid email");
            return;
        }
        if(!validateExpirationTime(expiration_time)){
            error_handler("invalid expiration time");
            return;
        }
        if(!validatePrice(price)){
            error_handler("invalid price");
            return;
        }
        if(!validateBuy(price)){
            error_handler("invalid buy");
            return;
        }
        var new_listing = new Listing(user_id, title, description, location, expiration_time, price, buy);
        var collection_listings = database.collection('listings');
        collection_listings.insert(new_listing, function (err, count, status) {
            if(err){error_handler(err.message);}
            else{
                collection_listings.find(new_listing).toArray(function(err, docs){
                    if(docs.length == 1){
                        new_listing.initFromDatabase(docs[0]);
                        try {
                            console.log("new listing added!")
                            console.log(new_listing)
                            active_listings.add(new_listing);
                            user.addCurrentListingId(new_listing._id); //adds the new listing_id to user's current_listings
                        }catch(e){error_handler(e.message)};
                        if(callback != undefined){ callback(new_listing);}
                    }
                    else{
                        error_handler("more than 1 listing inserted into database");
                        return;
                    }
                });
            }
        });
    }, error_handler)
}

//1. authenticate if not successful pass message to error_handler
//2. get listing from active_listings using listing_id, if not found pass message to error handler
//3. if user_id of listing matches user_id, then remove listing from active_listings
//4. remove listing_id from user's current listings
//5. add listing_id to user's previous_listings
//5. notify all that a listing has been removed

//TODO: update the listing upon removal, i.e set active to false
function removeListing(listing_id, callback, error_handler){
    var listing = active_listings.get(listing_id);
    console.log("removeListing called");
    //TODO: updateListing removed because mongodb throws an error because of it for some reaosn, fix this later
    //TODO: all this causes is that removed listings won't have the most up to date info, however since listings are
    //TODO: never reused, this doesn't matter.
    if(listing != undefined) {
        listing.active = false; //deactivate the listing
        updateListings(listing, function () {
            var user = active_users.get(listing.user_id)
            active_listings.remove(listing_id);
            if (user != undefined) { //in case user has already logged out
                user.removeCurrentListingId(listing_id); //does this remove it for the user object in active_users? test for this
            }
            if (callback != undefined) {
                callback(listing_id);
            }
        }, error_handler);
    }
}


//makes a transaction from a listing and sends a transaction_request to the owner of the listing
//adds transaction to the current_Transaction of initator
//note we handle sending transaction request part in the router, since router has access to socket

//TODO: save the transaction state, so active_transactions can be restored upon server crash
//TODO: set active to true

function makeTransactionRequest(user_id, password, listing_id, callback, error_handler){
    authenticate(user_id, password, function(user) {
        makeTransaction(user_id, listing_id, function (transaction) {
            callback(transaction); //pass listing_id back for testing purposes (so owner of listing can accept)
        }, error_handler)
    }, error_handler);
    //called on a user (using user_id) and a listing (using listing_id)
//1. authenticate, if successful proceed; else return message to error_handler ("invalid authentication info")
//2. get listing from active_listings, if null then return message to error_handler
//3. check to make sure that the user_id on listing isn't the user_id intiating the transaction (can't have transaction with self)
//4. if transaction is of type buy then user_id is seller_user_id else buyer_user_id
//5. create a transaction from the listing, add the database, (get _id), and then add to active_transactions
    //6. add the transaction_id of new transaction to the user who initiated
    function makeTransaction(user_id, listing_id, callback, error_handler){
        try {
            var new_transaction = createTransactionFromListing(user_id, listing_id);
        }catch(e){
            error_handler(e.message);
            return;
        }
        addTransactionToDatabase(new_transaction, function(new_transaction){
            try {
                console.log("adding to active_transactions");
                active_transactions.add(new_transaction);
                var user = active_users.get(user_id);
                user.addCurrentTransactionId(new_transaction._id); //adds transaction_id to user that initiates
                //user object is returned by authenticate
            }catch(e){error_handler(e.message)};
            if(callback != undefined && callback != null){
                console.log("callback(new_transaction)");
                console.log(new_transaction);
                callback(new_transaction);
            }
        });

        function createTransactionFromListing(user_id, listing_id){
            var listing = active_listings.get(listing_id);
            if(listing == undefined){
                throw {message: "makeTransaction: no listing found with listing_id "};
                return;
            }
            //don't make transaction if listing has expired
            if(listing.isExpired()){
                throw {message: "makeTransaction: listing with id " + listing_id + " has expired"};
                return;
            }
            var user_buy_id;
            var user_sell_id;
            if(listing.buy == true){
                user_sell_id = user_id;
                user_buy_id = listing.user_id;
            }
            else{
                user_sell_id = listing.user_id;
                user_buy_id = user_id;
            }
            return new Transaction(user_buy_id, user_sell_id, listing);
        }

        function addTransactionToDatabase(new_transaction, callback){
            var collection_transactions = database.collection('transactions');
            collection_transactions.insert(new_transaction, function (err, count, status) {
                if(err){error_handler(err.message);}
                else{
                    collection_transactions.find(new_transaction).toArray(function(err, docs){
                        if(docs.length == 1){
                            new_transaction.initFromDatabase(docs[0]);
                            if(callback != undefined){ callback(new_transaction);}
                        }
                        else{
                            error_handler("more than 1 transaction inserted into the database");
                            return;
                        }
                    });
                }
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
            error_handler({message: "unable to find transaction with transaction_id: " + transaction_id});
            return;
        }
        try {
            transaction.acceptRequest(user._id);
            //throws error if user with the user_id has already accepted request or if user_id
            //doesn't match either user_id of the transactions
            //verify that the other user has already accepted_request if not throw error
        }catch(e){
            error_handler(e.message);
            return;
        }
        var listing = active_listings.get(transaction.listing_id);
        //throws error if transaction_id has already been set
        //or listing has already been deleted, means listing has already been accepted
        if(listing == undefined || listing.transaction_id != null){
            error_handler({message: "user with user id " + user_id + "has already accepted another transaction for this listing"});
            return;
        }
        //decline all other transactions in based on this listing besides current transaction
        var transaction_arr = active_transactions.getAllForListingId(listing._id);
        for(var i=0; i <transaction_arr.length; i++){
            var transaction = transaction_arr[i];
            if(transaction._id != transaction_id) {
                declineTransactionRequest(user_id, password, transaction._id, function (transaction_id) {
                }, error_handler)
            }
        }
        listing.transaction_id = transaction_id; //set transaction_id to listing before updating it in database
        //update listing in database
        removeListing(transaction.listing_id, function(){
            if(user != undefined) { //in case user has logged out
                user.addCurrentTransactionId(transaction_id);
            }
        }, error_handler)
        // updateListings(listing, function(){
        //     active_listings.remove(transaction.listing_id);
        //     //add transaction to current transaction of accepting user, user object returned by authenticate
        //     if(user != undefined) { //in case user has logged out
        //         user.addCurrentTransactionId(transaction_id);
        //     }
        //     //since transaction has started remove the listing from the current listing of the user
        //     //this is already taken care of in removeListing
        //     // var listingOwner = active_users.get(user._id);
        //     // if(listingOwner)
        //     // listingOwner.removeCurrentListingId(listing._id);
        //     //send message to both users that transaction has begun
        //     // sendTransactionStartedMessage(transaction, function(){
        //         callback(transaction);
        //     // }, error_handler);
        // });


    }, error_handler);
}

//1-4 same as acceptTransactionRequest()
//5. set the accept_request boolean that corresponds to the user_id to false
//6. update transaction in transaction database
//7. remove transaction from active_transactions
//8. message user that initiated request that their transaction has been declined

//TODO: set active to false
function declineTransactionRequest(user_id, password, transaction_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        if(transaction == null || transaction == undefined){
            error_handler({message: "unable to find transaction with transaction_id: " + transaction_id});
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
        //update transaction in database before deleting it so we have a record of the failed transaction
        updateTransactions(transaction, function(){
            //send message to user that initiated request that request was declined
            // remove transaction_id from initiating user (transaction_id was never added to declining user)
            var buyer = active_users.get(transaction.buyer_user_id);
            var seller = active_users.get(transaction.seller_user_id);
            if(transaction.buyer_accepted_request == true){
                buyer.removeCurrentTransactionId(transaction_id);
            }
            else{
                seller.removeCurrentTransactionId(transaction_id);
            }
            //remove transaction from active_transactions
            active_transactions.remove(transaction._id);
            callback(transaction);
            
        }, error_handler);


    }, error_handler);
}

//1. authenticate, same as above
//2. get transaction, same as above
//3. confirm the transaction (call confirm on the transaction), passing in user_id
//4. check if the transaction ahs completed, sendTransactionCompletedMessage To Users
//5. update transaction in database
//6. remove transaction from active_transactions

//TODO: set active to false
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
            error_handler(e.message);
            return;
        }
        //TODO: watch out for situation where both users confirm at the same time
        console.log("checking is Confirmed inside transaction");
        console.log("isCompleted() == " + transaction.isCompleted());
        if(transaction.isCompleted() == true){
            updateTransactions(transaction, function(){
                var user1 = active_users.get(transaction.buyer_user_id);
                var user2 = active_users.get(transaction.seller_user_id);
                if(user1 != undefined){
                    user1.removeCurrentTransactionId(transaction_id);
                }
                if(user2 != undefined){
                    user2.removeCurrentTransactionId(transaction_id);
                }
                active_transactions.remove(transaction_id);
                callback(transaction);
            }, error_handler)
        }
        else{
            callback(transaction);
        }
    }, error_handler);
}

//1. authenticate, same as above
//2. get transaction, same as above
//3. reject the transaction (call reject on the transaction), passing in user_id
//4. check if transaction has completed, if so run appropriate methods

//TODO: set active to false
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
            error_handler(e.message);
            return;
        }
        // sendTransactionRejectedMessage(transaction, function(){
            updateTransactions(transaction, function(){
                var user1 = active_users.get(transaction.buyer_user_id);
                var user2 = active_users.get(transaction.seller_user_id);
                if(user1 != undefined){
                    user1.removeCurrentTransactionId(transaction_id);
                }
                if(user2 != undefined){
                    user2.removeCurrentTransactionId(transaction_id);
                }
                active_transactions.remove(transaction_id);
                callback();
            }, error_handler)
        // }, error_handler)
    }, error_handler)
}

//1. authenticate
//2. validate the location
//3. update the users location to the new_location
function updateUserLocation(user_id, password, new_location, callback, error_handler){
    authenticate(user_id, password, function(user){
        if(validateLocation(new_location) == true){
            //transform the ordered pair into a Location object (regardless of whether it was a Location or just a normal
            //object)
            user.location = new Location(new_location.latitude, new_location.longitude);
            callback(user.location);
        }
        else{
            error_handler("the location passed to update_user_location is invalid");
        }
    }, error_handler)
}

//1. authenticate
//2. find the transaction
//3. verify user is one of the users of the transaction
//4. send a message in the conversation
function sendChatMessage(user_id, password, transaction_id, message_text, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        if(transaction.buyer_user_id.toString() == user._id.toString() || transaction.seller_user_id.toString() == user_id.toString()){
            try {
                var message = transaction.sendMessage(user, message_text);
                callback(message);
            }catch(e){
                error_handler(e.message);
                return;
            }
        }
        else{
            error_handler("user with user_id " + user_id + " tried to send a message to conversation in a transaction of which he/she is not apart of");
        }
    }, error_handler)
}

//1. authenticate
//2. get active_listings
//3. return active_listings
function getAllActiveListings(user_id, password, callback, error_handler){
    authenticate(user_id, password, function(user){
        var all_active_listings = active_listings.getAll();
        callback(all_active_listings);
    }, error_handler)
}

//Finds user in active_users if not found, searches database, returns a UserInfo object made from the User
function getUser(user_id, callback, error_handler){
    var user = active_users.get(user_id);
    //if user is not in active_users, search database
    if(user == undefined){
        var collection = database.collection('users');
        collection.find({_id: user_id}).toArray(function(err, docs) {
            if (docs.length > 0) {
                //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                var user = new User();
                user.initFromDatabase(docs[0]);
                var user_info = new UserInfo(user);
                user_info.logged_in = false;
                callback(user_info);

            }
            else {
                error_handler("user with user_id " + user_id + " was not found");
            }
        });
    }
    //if user is in active_users then logged in, thus set the parameter and return user;
    else{
        var user_info = new UserInfo(user);
        user_info.logged_in = true;
        callback(user_info)
    }
}

function getListing(listing_id, callback, error_handler){
    var listing = active_listings.get(listing_id);
    //if user is not in active_users, search database
    if(listing == undefined){
        var collection = database.collection('listings');
        collection.find({_id: listing_id}).toArray(function(err, docs) {
            if (docs.length > 0) {
                //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                var listing = new Listing();
                listing.initFromDatabase(docs[0]);
                var listing_info = new ListingInfo(listing);
                listing_info.active = false;
                callback(listing_info);

            }
            else {
                error_handler("listing with listing_id " + listing_id + " was not found");
            }
        });
    }
    //if user is in active_users then logged in, thus set the parameter and return user;
    else{
        var listing_info = new ListingInfo(listing);
        listing_info.active = true;
        callback(listing_info)
    }
}

function updateTransactions(transaction, callback, error_handler){
    var collection_transactions = database.collection('transactions');
    collection_transactions.update({_id: transaction._id}, transaction, {upsert: true}, function (err, count, status) {
        if(err){error_handler(err.message);}
        else{
            if(callback != undefined && callback != null){callback();}
        }
    });
}

function updateListings(listing, callback, error_handler){
    var collection_listings = database.collection('listings');
    collection_listings.update({_id: listing._id}, listing, {upsert: true}, function (err, count, status) {
        if(err){error_handler(err.message);}
        else{
            if(callback != undefined && callback != null){callback();}
        }
    });
}

//**********************************
//**END Client->Server API methods**
//**********************************

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

//user_id, title, description, location, expiration_time, price, buy

function validateTitle(title){
    // return typeof title == 'string' && title.length > 0 && title.length <=30;
    return true;
}

function validateDescription(description){
    // return description.length > 0 && description.length <= 140;
    return true;
}

function validateLocation(location){
    // return (typeof location == 'object') && (location.x != undefined) && (location.y != undefined) && (typeof location.x == 'number') && (typeof location.y == 'number');
    return true;
}


function validateExpirationTime(expiration_time){
    // return typeof expiration_time == 'number';
    return true;
}

function validatePrice(price){
    // return typeof price == 'number';
    return true;
}

function validateBuy(buy){
    // return typeof buy == 'boolean';
    return true;
}