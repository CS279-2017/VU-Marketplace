var http = require('http');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var apn = require('apn');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = require('mongodb').MongoClient;
// Connection URL. This is where your mongodb server is running.
// var url = 'mongodb://localhost:27017/mealplanappserver';
var url = 'mongodb://heroku_g6cq993c:f5mm0i1mjj4tqtlf8n5m22e9om@ds129018.mlab.com:29018/heroku_g6cq993c'
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
var Event = require("./classes/event.js");


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
exports.terminateTransaction = terminateTransaction;

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

// Set up apn with the APNs Auth Key
var apnProvider = new apn.Provider({
    token: {
        key: 'apnkey.p8', // Path to the key p8 file
        keyId: 'Y3M29GE5QJ', // The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
        teamId: 'DE4758AREF', // The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
    },
    production: false // Set to true if sending a notification to a production iOS app
});

var active_listings = null;
var active_users = null;
var active_transactions = null;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Example app listening on port ' + port);
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
        
        //restore all active_listings and active_transactions
        getActiveListingsFromDatabase(function(listings){
            active_listings.initFromDatabase(listings);
            // console.log(active_listings.getAll());
        }, function(error){
            console.log(error);
        });

        getActiveTransactionsFromDatabase(function(transactions){
            active_transactions.initFromDatabase(transactions);
            // console.log(active_transactions.getAll());
        }, function(error){
            console.log(error);
        });
        
    });

    //remove all expired active_listings once a minute
    initExpiredListingGarbageCollector(1000);
});

app.get('/', function (req, res) {
    res.send('If you have any questions about MealPlanApp, please email mealplanapp@gmail.com');
});

//TODO: when a user connects check if they are logged in, if not then tell them to login, this is done on the client side
io.on('connection', function (socket) {
    console.log("user has connected!");
    // socket.emit('event', { data: 'server data' });
    //TODO: should active_listings and transactions be terminated? no unless terminated by other party
    //TODO: should user be logged out when disconnected? maybe
    //log the user out on disconnect
    //send 'logged_out_due_to_disconnect' event to user
    socket.on('disconnect', function() {
        //TODO: record that the user is disconnected
        //TODO: start sending push notifications rather than socket events for import events like
        //TODO: transaction requests and listing expirations and transaction accept or decline, tranaction terminations or confirmations
        console.log('user has disconnected!');
        var socket_id = socket.id
        var disconnected_user = active_users.getUserBySocketId(socket_id);
        // disconnected_user.sockets
        var error_handler = function (e) {
            console.log(e);
            return;
        }
        //TODO: don't logout upon disconnect
        // if(disconnected_user != null) {
        //     logout(disconnected_user._id, disconnected_user.password, function (user_id) {
        //         console.log("user with id " + disconnected_user._id + " logged out due to disconnected")
        //         socket.emit('logged_out_due_to_disconnect', {data: null, error: null});
        //     }, error_handler)
        // }
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
        
        // var first_name = json.first_name;
        // var last_name = json.last_name;
        // var confirm_password = json.confirm_password;
        var email_address = json.email_address.toLowerCase();
        var callback = function(){
            socket.emit("register_verification_code_response", {data: null, error: null});
        };
        var error_handler = function(e) {
            socket.emit("register_verification_code_response", {data: null, error: e});
            console.log(e);
        }
        registerVerificationCode(verification_code, email_address, password, callback, error_handler);
    });

    socket.on('login', function(json){
        var email_address = json.email_address.toLowerCase();
        var password = json.password;
        var device_token = json.device_token;

        var callback = function(user){
            //send user_id back to user
            //notify necessary clients that a user has logged is
            user.socket_id = socket.id; //store the socket_id of the user upon login and authentication
            active_users.get(user._id).device_token = device_token;
            console.log("new device token: " + device_token);
            socket.emit("login_response", {data: {user_id: user._id}, error: null});
        };
        var error_handler = function(e) {
            socket.emit("login_response", {data: null, error: e});
            console.log(e);
        }
        //TODO: should we allow logging in from multiple devices at once? for now yes
        login(email_address, password, callback, error_handler);
    });

    socket.on('logout', function(json){
        var user_id = json.user_id;
        var password = json.password;

        function callback(){
            //notify necessary clients that a sure has logged out
            // active_listings.
            if(socket != undefined) {
                socket.emit("logout_response", {data: null, error: null});
            }
            io.emit("user_logged_out", {data: {user_id: user_id}});
            // }socket.emit("logout_response", {data: null, error: null});
        }
        function error_handler(e){
            if(socket != undefined){
                socket.emit("logout_response", {data: null, error: e});
            }
            console.log(e);
        }
        logout(user_id, password, callback, error_handler);
    });

    //authenticates user_id and password info and sends back confirmation if valid
    socket.on('authenticate', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token;

        function callback(user){
            user.socket_id = socket.id; //store the socket_id of the user upon login and authentication
            socket.emit('authenticate_response', {data: null, error: null});
            // if(user.event_queue != undefined) {
            //     while (user.event_queue.count > 0) {
            //         var event = user.dequeueEvent();
            //         socket.emit(event.name, event.message);
            //         console.log(socket.name + " emitted from event queue with data "+event.message.toString())
            //     }
            // }
        }

        function error_handler(e){
            socket.emit('authenticate_response', {data: null, error:e});
            console.log(e);
        }
        console.log("user");
        console.log(active_users.get(user_id));
        console.log(device_token);
        if(active_users.get(user_id) != undefined && (device_token != active_users.get(user_id).device_token)){
            //actually its a device_token but that client ios app has a case that handles this string message;
            console.log("entered device_token: " + device_token)
            console.log("actual device_token: " + active_users.get(user_id).device_token);
            error_handler("tried to authenticate an invalid user_id/password combination");
        }
        else{
            console.log("device_token: " + device_token);
            authenticate(user_id, password, callback, error_handler);
        }
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

    socket.on('update_listing', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var listing_id = json.listing_id
        var title = json.title;
        var description = json.description;
        var location = json.location;
        var expiration_time = json.expiration_time;
        var price = json.price;
        var buy = json.buy;

        authenticate(user_id, password, function(user){
            var listing = active_listings.get(listing_id);
            var new_listing = new Listing(user_id, title, description, location, expiration_time, price, buy);
            if(user._id.toString() == listing.user_id.toString()){
                updateListing(listing, new_listing, callback, error_handler)
            }
            else {
                error_handler("This listing doesn't belong to you!");
            }
        }, error_handler)
        function callback(listing){
            socket.emit("update_listing_response", {data: null, error: null});
            //emit event to all users that a new listing has been made
            console.log("updatedListing returned: ");
            console.log(listing);
            io.emit("listing_updated", {data: {listing: listing}});
        }
        function error_handler(e){
            socket.emit("update_listing_response", {data: null, error: e});
            console.log(e);
        }
    });

    //TODO: what happens if a you try to remove a listing that transactions have been made from?
    //TODO: listings are only templates for creating transactions, thus once a transaction has been created 
    //TODO: it is only loosely related to the listing through the listing_id but otherwise has a life of its own
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
            if(listing != undefined){
                if(listing.user_id.toString() == user_id.toString()){
                    removeListing(listing_id, callback, error_handler)
                }
                else{
                    error_handler("user_id doesn't match user_id of user who created the listing, unable to delete listing");
                }
            }
            else{
                error_handler("listing was not found in active_listings");
            }

        }, error_handler);
    });
    //initiate_transaction_request:
    //1. make the transaction
    //2. send transaction_request to user who owns the listing
    //3. await response from user

    //TODO: make a message queue of transaction_request_made events to send to user if user is disconnected
    //TODO: can send push notifications to user
    //tODO: what if same user makes multiple transactions on one listing?
    //TODO: making a transaction from a listing that is being removed i.e no longer exists
    //TODO: making a transaction with a user that is offline or disconnected
    //TODO: multiple transactions can be made on a single listing
    //TODO: max number of transactions per user?

    //make_transcation_request creates the transaction object and passes it to both users
   socket.on('make_transaction_request', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var listing_id = json.listing_id; 
        function callback(transaction){
            //send transaction request to other user first then notify calling user of success
            //upon receiving the make_transaction_request_response the intial calling user can make a transaction object
            try {
                //Sends message to other user that a transaction has been made on their listing
                // var this_user = active_users.get(user_id)
                // var this_user_socket = io.sockets.connected[this_user.socket_id];
                // setTimeout(function(){
                //     declineTransactionRequest(transaction.getOtherUserId(user_id), password, transaction._id, function(){
                //        
                //     }, error_handler)
                // }, 60000)
                var user = active_users.get(user_id);
                var user_socket = io.sockets.connected[user.socket_id];
                var other_user = active_users.get(transaction.getOtherUserId(user_id));
                var other_user_socket = io.sockets.connected[other_user.socket_id];
                var event = new Event("transaction_request_made", {
                    transaction: transaction
                }, null)
                //emit the event to both users, causes them to make cells
                if(other_user_socket != undefined) {
                    other_user_socket.emit(event.name , event.message);
                }
                else{
                    if(other_user != undefined) {
                        // other_user.enqueueEvent(event);
                        var alert = user.first_name + " " + user.last_name + " is requesting to " +
                            (transaction.buy ? "sell " : "buy ") + transaction.title + " for " + transaction.price;
                        notification_info = {alert: alert, category: "TRANSACTION_REQUEST_MADE", payload: {transaction_id: transaction._id}};
                        sendNotification(notification_info, other_user.device_token);
                    }
                }
                if(user_socket != undefined) {
                    user_socket.emit(event.name , event.message);
                }
                else{
                    if(user != undefined) {
                        user.enqueueEvent(event);
                    }
                }
                // if(this_user_socket != undefined) {
                //     this_user_socket.emit(event.name , event.message);
                // }
                // else{
                //     if(other_user != undefined) {
                //         other_user.enqueueEvent(event);
                //     }
                // }
            }catch(e){
                error_handler(e.message)
                return;
            }
            socket.emit("make_transaction_request_response", {data: transaction, error: null});
            //notify user that initiated the transaction that transaction request was successful, passes back
            //transaction object so user can create a transaction object on the client side
        }
        function error_handler(e) {
            socket.emit("make_transaction_request_response", {data: null, error: e});
            console.log(e);
        }
        try {
            makeTransactionRequest(user_id, password, listing_id, callback, error_handler);
        }catch(e){
            error_handler(e.message);
        }
    });

    //TODO: accepting a transaction that's already been accepted
    //TODO: accepting a transaction request on a transaction that no longer exists (there is no request object, only a transaction object) can the other user cancel a transaction requesT?
    //TODO: max number of transactions per user?
    socket.on('accept_transaction_request', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var transaction_id = json.transaction_id;
        function callback(transaction){
            console.log("emitting accept_transaction_response");
            socket.emit("accept_transaction_request_response", {data: null, error: null});
            //notify users involved in the transaction that transaction has been accepted, will start
            try {
                //notify all users that a listing was removed
                io.emit("listing_removed", {data: {listing_id: transaction.listing_id}});
                console.log("transaction:")
                console.log(transaction);
                var buyer = active_users.get(transaction.buyer_user_id);
                var seller = active_users.get(transaction.seller_user_id);
                var buyer_socket = io.sockets.connected[buyer.socket_id];
                var seller_socket = io.sockets.connected[seller.socket_id];
                emitEvent("transaction_request_accepted", {transaction_id: transaction_id.toString(), user_id: user_id}, [transaction.buyer_user_id, transaction.seller_user_id]);
                if(transaction.isAccepted()){
                    console.log("emitting transaction_started");
                    emitEvent("transaction_started", {transaction_id: transaction_id.toString()}, [transaction.buyer_user_id, transaction.seller_user_id]);
                }
                var event = new Event("transaction_started", {transaction_id: transaction_id.toString()} , null)
                if(buyer_socket == undefined) {
                    var other_user = active_users.get(transaction.getOtherUserId(user_id));
                    var other_user_name = other_user.first_name + " " + other_user.last_name;
                    var buying_or_selling = transaction.buyer_user_id == user_id ? "buying" : "selling"
                    var alert = "Your transaction with " + other_user_name + " has begun! You are " + buying_or_selling
                    + "'" + transaction.title + "'";
                    notification_info = {alert: alert, category: "TRANSACTION_STARTED", payload: {transaction: transaction}};
                    if(buyer != undefined) {
                        sendNotification(notification_info, buyer.device_token);
                    }

                }
                if(seller_socket == undefined) {
                    var other_user = active_users.get(transaction.getOtherUserId(user_id));
                    var other_user_name = other_user.first_name + " " + other_user.last_name;
                    var buying_or_selling = transaction.buyer_user_id == user_id ? "buying" : "selling"
                    var alert = "Your transaction with " + other_user_name + " has begun! You are " + buying_or_selling
                        + "'" + transaction.title + "'";
                    // notification_info = {alert: alert, category: "TRANSACTION_STARTED", payload: {transaction: transaction}};
                    notification_info = {alert: alert, category: "TRANSACTION_STARTED", payload: {transaction: transaction}};

                    if(seller != undefined){
                        sendNotification(notification_info, seller.device_token);
                    }
                    // seller.enqueueEvent(event);
                }
            }catch(e){
                console.log(e);
                return;
            }
        }
        function error_handler(e){
            socket.emit("accept_transaction_request_response", {data: null, error: e});
            console.log(e);
        }
        try {
            acceptTransactionRequest(user_id, password, transaction_id, callback, error_handler)
        }catch(e){
            error_handler(e.message);
        }
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
                emitEvent("transaction_request_declined", {transaction_id: transaction._id.toString(), user_id: user_id}, [user_id, transaction.getOtherUserId(user_id)]);
                var user = active_users.get(user_id);
                var user_socket = io.sockets.connected[user.socket_id];
                var other_user = active_users.get(transaction.getOtherUserId(user_id));
                var other_user_socket = undefined;
                if(other_user != undefined){
                   other_user_socket = io.sockets.connected[other_user.socket_id];
                }
                // var event = new Event("transaction_request_declined", , null);
                if(other_user_socket == undefined) {
                    // var other_user = active_users.get(transaction.getOtherUserId(user_id));
                    // var other_user_name = other_user.first_name + " " + other_user.last_name;
                    // var buying_or_selling = transaction.buyer_user_id == user_id ? "buying" : "selling"
                    var user_name = user.first_name + " " + user.last_name;
                    var alert = "Your transaction request for '" + transaction.title + "' was declined by " + user_name;
                    notification_info = {alert: alert, category: "TRANSACTION_REQUEST_DECLINED"};
                    if(other_user != undefined){
                        sendNotification(notification_info, other_user.device_token);

                    }
                //     other_user_socket.emit(event.name , event.message);
                // }
                // else{
                //     if(other_user != undefined) {
                //         other_user.enqueueEvent(event);
                //     }
                }
                if(user_socket != undefined) {
                //     user_socket.emit(event.name , event.message);
                // }
                // else{
                //     if(user != undefined) {
                //         user.enqueueEvent(event);
                //     }
                }
                //TODO: add some
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
               // var event = new Event("transaction_confirmed", {user_id: user_id.toString(), transaction_id: transaction_id.toString()}, null);
               emitEvent("transaction_confirmed", {user_id: user_id.toString(), transaction_id: transaction_id.toString()}, [transaction.buyer_user_id, transaction.seller_user_id]);
               var buyer = active_users.get(transaction.buyer_user_id);
               var seller = active_users.get(transaction.seller_user_id);
               var buyer_socket = io.sockets.connected[buyer.socket_id];
               var seller_socket = io.sockets.connected[seller.socket_id];
               var user = active_users.get(user_id);
               var user_name = user.first_name + " " + user.last_name;
               if(!transaction.isCompleted()){
                   var alert = user_name + " has confirmed the transaction '" + transaction.title + "'";
                   var notification_info = {alert: alert, payload: {transaction: transaction}, category: "TRANSACTION_CONFIRMED"};
                   if(buyer_socket == undefined && buyer != undefined) {
                       sendNotification(notification_info, buyer.device_token);
                   }
                   if(seller_socket != undefined && seller != undefined) {
                       sendNotification(notification_info, seller.device_token);
                   }
               }
               if(transaction.isCompleted()){
                   var alert = "The transaction '" + transaction.title + "' was completed!";
                   var notification_info = {alert: alert, payload: {transaction: transaction}, category: "TRANSACTION_COMPLETED"};
                   //notify users that transaction is completed
                   var event = new Event("transaction_completed", {transaction_id: transaction_id}, null);
                   if(buyer_socket != undefined) {
                       buyer_socket.emit(event.name , event.message);
                   }
                   else{
                       if(buyer != undefined) {
                           sendNotification(notification_info, buyer.device_token);
                       }
                   }
                   if(seller_socket != undefined) {
                       seller_socket.emit(event.name , event.message);
                   }
                   else{
                       if(seller != undefined) {
                           sendNotification(notification_info, seller.device_token);
                       }
                   }
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
       try {
           confirmTransaction(user_id, password, transaction_id, callback, error_handler);
       }catch(e){
           error_handler(e.message);
       }
   });

    //TODO: rejecting a transaction thats already been rejected
    //TODO: rejecting a transaction that doesn't exist
   socket.on('terminate_transaction', function(json){
       var user_id = json.user_id;
       var password = json.password;
       var transaction_id = json.transaction_id;
       function callback(transaction){
           //notify both users in the transaction that this user has rejected the transaction
           try {
               console.log("terminate Transactinon successful!")
               console.log(transaction)
               var user = active_users.get(user_id);
               var other_user = active_users.get(transaction.getOtherUserId(user_id));
               var alert = user.first_name + " " + user.last_name + " has terminated the transaction '" + transaction.title + "'";
               var notification_info = {alert: alert, category: "TRANSACTION_TERMINATED"};
               if(other_user != undefined){
                   sendNotification(notification_info, other_user.device_token);
               }
               emitEvent("transaction_terminated", {user_id: user_id, transaction_id: transaction_id}, [transaction.buyer_user_id, transaction.seller_user_id]);
           }catch(e){
               console.log(e);
               return;
           }
           socket.emit("terminate_transaction_response", {data: null, error: null});
       }
       function error_handler(e){
           socket.emit("terminate_transaction_response", {data: null, error: e});
           console.log(e);
       }
       try {
           terminateTransaction(user_id, password, transaction_id, callback, error_handler)
       }catch(e){
           error_handler(e.message);
       }
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
            // console.log("successfully updated user_location")
            // console.log("users current transaction_ids")
            // console.log(user.current_transactions_ids);
            var current_transaction_ids = user.current_transactions_ids;
            try {
                for (var key in current_transaction_ids) {
                    var transaction_id = current_transaction_ids[key];
                    try {
                        var transaction = active_transactions.get(transaction_id);
                        var other_user_id = transaction.getOtherUserId(user_id);
                        var other_user = active_users.get(other_user_id);
                        var other_user_socket = io.sockets.connected[other_user.socket_id];
                        // console.log("emitting user_location_updated");
                        other_user_socket.emit("user_location_updated", {
                            data: {
                                user_id: user._id.toString(),
                                transaction_id: transaction_id.toString(),
                                updated_location: updated_location
                            }, error: null
                        });
                    }catch(e){error_handler(e.message)}
                }
            }catch(e){
                console.log(e);
                return;
            }
        }
        function error_handler(e){
            socket.emit("update_user_location_response", {data: null, error: e});
            // console.log(e);
        }
        updateUserLocation(user_id, password, new_location, callback, error_handler)
    });

    socket.on('update_venmo_id', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var venmo_id = json.venmo_id;
        function callback(updated_venmo_id){
            socket.emit("update_venmo_id_response", {data: {updated_venmo_id: updated_venmo_id}, error: null});
            //notify all users, or all users in the same transaction with user whose venmo_id was updated,
            var user = active_users.get(user_id);
            console.log(user);
            var current_transaction_ids = user.current_transactions_ids;
            try {
                // for (var key in current_transaction_ids) {
                //     var transaction_id = current_transaction_ids[key];
                //     var transaction = active_transactions.get(transaction_id);
                //     var other_user = active_users.get(transaction.getOtherUserId(user_id));
                //     var other_user_socket = io.sockets.connected[other_user.socket_id];
                //     if(other_user_socket != undefined){
                //         other_user_socket.emit("venmo_id_updated", {data: {user_id: user._id, venmo_id: venmo_id, updated_location: updated_location}, error: null});
                //     }
                // }
                io.emit("venmo_id_updated", {data: {user_id: user._id, venmo_id: venmo_id}, error: null});

            }catch(e){
                console.log(e.message);
                error_handler(e.message);
                return;
            }
        }
        function error_handler(e){
            socket.emit("update_venmo_id_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, function(user){
            updateVenmoId(user_id, venmo_id, callback, error_handler)
        })
    });

    socket.on('update_profile_picture', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var profile_picture = json.profile_picture;
        // console.log(profile_picture.length);
        authenticate(user_id, password, function(user){
            updateProfilePicture(user_id, profile_picture, callback, error_handler)
        }, error_handler)

        function callback(){
            socket.emit("update_profile_picture_response", {data: null, error: null});
            io.emit("profile_picture_updated", {data: {user_id: user_id}, error: null});
        }

        function error_handler(e){
            socket.emit("update_profile_picture_response", {data: null, error: e});
            console.log(e);
        }
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
                // var buyer = transaction.buyer_user_id;
                // var seller = transaction.seller_user_id;
                // var buyer_socket = io.sockets.connected[buyer.socket_id];
                // var seller_socket = io.sockets.connected[seller.socket_id];
                // buyer_socket.emit("chat_message_sent", {data: {transaction_id: transaction_id, message: message}, error: null});
                // seller_socket.emit("chat_message_sent", {data: {transaction_id: transaction_id, message: message}, error: null});
                var user = active_users.get(user_id);
                var other_user_id = transaction.getOtherUserId(user_id);
                var other_user = active_users.get(other_user_id);
                var other_user_socket = undefined
                if(other_user != undefined){
                   other_user_socket = io.sockets.connected[other_user.socket_id];
                }
                if(other_user_socket == undefined){
                    var alert = user.first_name + " " + user.last_name + ": " + message_text;
                    var notification_info = {alert: alert, category: "CHAT_MESSAGE_SENT", payload: {transaction: transaction}};
                    if(other_user != undefined) {
                        sendNotification(notification_info, other_user.device_token);
                    }
                }
                emitEvent("chat_message_sent", {transaction_id: transaction_id, message: message}, [transaction.buyer_user_id, transaction.seller_user_id])
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

    socket.on('get_users_active_transactions', function(json){
        var user_id = json.user_id;
        var password = json.password;
        function callback(users_active_transactions){
            //send all_active_listings back to client
            socket.emit("get_users_active_transactions_response", {data: {users_active_transactions: users_active_transactions}, error: null});
        }
        function error_handler(e){
            socket.emit("get_users_active_transactions_response", {data: null, error: e});
            console.log(e);
        }
        getUsersActiveTransactions(user_id, password, callback, error_handler)
    });

    socket.on('get_users_previous_transactions', function(json){
        console.log("get_users_previous_transactions called");
        var user_id = json.user_id;
        var password = json.password;
        function callback(users_previous_transactions){
            //send all_active_listings back to client
            console.log("get_users_previous_transactions successful!");
            // console.log(users_previous_transactions);

            socket.emit("get_users_previous_transactions_response", {data: {users_previous_transactions: users_previous_transactions}, error: null});
        }
        function error_handler(e){
            socket.emit("get_users_previous_transactions_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, function(user){
            getUsersPreviousTransactions(user_id, callback, error_handler)
        }, error_handler);
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

    socket.on('get_listings_with_hash_tag', function(json){
        // var login_info = json.login_info;
       var hash_tag = json.hash_tag;
        // authenticate()
        function callback(listings){
            socket.emit("get_listings_with_hash_tag_response", {data: {listings: listings}, error: null})
        }
        function error_handler(e){
            socket.emit("get_listings_with_hash_tag_response", {data: null, error: e})
        }
        getListingsWithHashTag(hash_tag, callback, error_handler)
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

    socket.on('get_profile_picture', function(json){
        console.log("get_profile_picture called!")
        var user_id = json.user_id;
        function callback(profile_picture){
            var end0 = new Date().getTime();
            console.log("Call to getProfilePicture took " + (end0 - start0) + " milliseconds.")
            console.log("getProfilePicture returned!")
            var start1 = new Date().getTime();
            socket.emit("get_profile_picture_response", {data: {user_id: user_id.toString(), profile_picture: profile_picture}, error: null});
            socket.emit("profile_picture_gotten", {data: {user_id: user_id.toString(), profile_picture: profile_picture}, error: null});
            var end1 = new Date().getTime();
            console.log("emitting profile_picture_gotten took " + (end1 - start1) + " milliseconds.")
            console.log("get_profile_picture_response emitted!");
        }
        function error_handler(e){
            socket.emit("get_profile_picture_response", {data: null, error: e});
            console.log(e);
        }
        console.log("getProfilePicture called!")
        var start0 = new Date().getTime();
        getProfilePicture(user_id, callback, error_handler);
    })
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
        error_handler("Must be a valid vanderbilt.edu email address")
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
            // var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var possible = "0123456789";

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
            sendEmail(email_address, verification_code);
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
//TODO: automatically infer first and last name from email_address
function registerVerificationCode(verification_code, email_address, password, callback, error_handler){
    console.log("called registerVerificationCode");

    //adds a function to String prototype to capitalize first letter
    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
    email_address = email_address.toLowerCase(); //converts email_address to lower_case because email_addresses are case insensitive
    if(!validateEmail(email_address)){
        error_handler("invalid password");
        return;
    }
    var first_name;
    var last_name;
    var nameString = email_address.substring(0, email_address.indexOf("@"));
    var nameStringSplit = nameString.split(".");
    if(nameStringSplit.length == 2){
        first_name = nameStringSplit[0];
        last_name = nameStringSplit[1];
    }
    else if(nameStringSplit.length ==3){
        first_name = nameStringSplit[0];
        last_name = nameStringSplit[2];
    }
    else{
        error_handler("the vanderbilt email is of invalid format");
        return;
    }
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
                //if not already logged in then add user to active_users
                if(active_users.get(user._id) == undefined) {
                    active_users.add(user);
                }
            }catch(error){
                error_handler(error.message);
                return;
            }
            // console.log(user.email_address + " is logged in");
            //return user._id, use this to authenticate, thus login is independent of login credentials
            if(callback != undefined){ callback(user); }

        }
        else{
            //if not found: alert user that login failed, because incorrect email_address/password
            error_handler("Incorrect Email Address or Password");
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
            collection.update({_id:new require('mongodb').ObjectID(user._id.toString())}, active_users.get(user_id), function(err, result) {
                if(err){error_handler(err); return;}
                console.log(user_id + " info saved to database");
                console.log(user.email_address + " has logged out");
                if(callback != undefined){ callback(); }
            });
            //removes all of the users_current_listings
            // for(var i=0; i<user.current_listings_ids.length; i++){
            //     var listing_id = user.current_listings_ids[i];
            //     removeListing(listing_id, function(){
            //         io.emit("listing_removed", {data: {listing_id: listing_id}});
            //     }, error_handler)
            // }
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

//note we do not want allow a single user to connect from multiple devices or maintain multiple connections
//since that would cause inconsistent location data, thus we want to only maintain a single socket connnection
//for each user thus socket_id is set upon login

//TODO: implement device_id
function authenticate(user_id, password, callback, error_handler){
    var user = active_users.get(user_id);
    // console.log("trying to authenticate user_id: " + user_id + " password: " + password);
    if(user == undefined){
        // console.log("invalid user id: + " + user_id);
        error_handler("tried to authenticate an invalid user_id/password combination");
    }
    else if(user.password != password){
        // console.log("invalid password");
        error_handler("tried to authenticate an invalid user_id/password combination");
    }
    else{
        // console.log("authentication success!!")
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
        var error_string = "";
        //must be less than 30 characters
        if(validateTitle(title) != ""){
            error_string += (validateTitle(title) + "\n");
        }
        //must be less than 140 characters
        if(validateDescription(description) != ""){
            error_string += (validateDescription(description) + "\n");
        }
        //must be a object with keys latitude and longitude
        if(validateLocation(location) != ""){
            error_string += (validateLocation(location) + "\n");
        }
        //must be a value between now and 2020
        if(validateExpirationTime(expiration_time) != ""){
            error_string += (validateExpirationTime(expiration_time) + "\n");
        }
        //must be a valid number
        else if(validatePrice(price) != ""){
            error_string += (validatePrice(price) + "\n");
        }
        //must be a boolean
        if(validateBuy(buy) != ""){
           error_string += (validateBuy(buy) + "\n");
        }
        if(error_string != ""){
            error_handler(error_string);
            return;
        }

        //limit the number of listings to 5
        if(active_listings.getAllForUser(user_id).length >= 3){
            error_handler("You cannot have more than 3 listings")
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
                            updateUserInDatabase(user, function(){

                            }, error_handler)
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

function updateListing(listing, new_listing, callback, error_handler){
    console.log("updateListing called");
    if(new_listing != undefined && listing != undefined) {
        var error_string = "";
        //must be less than 30 characters
        if(validateTitle(new_listing.title) != ""){
            error_string += (validateTitle(new_listing.title) + "\n");
        }
        //must be less than 140 characters
        if(validateDescription(new_listing.description) != ""){
            error_string += (validateDescription(new_listing.description) + "\n");
        }
        //must be a object with keys latitude and longitude
        if(validateLocation(new_listing.location) != ""){
            error_string += (validateLocation(new_listing.location) + "\n");
        }
        //must be a value between now and 2020
        if(validateExpirationTime(new_listing.expiration_time) != ""){
            error_string += (validateExpirationTime(new_listing.expiration_time) + "\n");
        }
        //must be a valid number
        else if(validatePrice(new_listing.price) != ""){
            error_string += (validatePrice(new_listing.price) + "\n");
        }
        //must be a boolean
        if(validateBuy(new_listing.buy) != ""){
            error_string += (validateBuy(new_listing.buy) + "\n");
        }
        if(error_string != ""){
            error_handler(error_string);
            return;
        }
        listing.update(new_listing);
        var collection_listings = database.collection('listings');
        collection_listings.update({_id: listing._id}, listing, {upsert: true}, function (err, count, status) {
            if(err){error_handler(err.message);}
            else{
                if(callback != undefined && callback != null){callback(listing);}
            }
        });
    }
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
        listing.removed_time = new Date().getTime();
        listing.active = false; //deactivate the listing
        updateListingInDatabase(listing, function () {
            var user = active_users.get(listing.user_id)
            active_listings.remove(listing_id);
            if (user != undefined) { //in case user has already logged out
                try {
                    user.removeCurrentListingId(listing_id);
                    updateUserInDatabase(user, function(){

                    }, error_handler)
                }catch(e){
                    error_handler(e.message)
                }
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

//TODO: make sure user hasn't already made a transaction on this listing
function makeTransactionRequest(user_id, password, listing_id, callback, error_handler){
    authenticate(user_id, password, function(user) {
        console.log("checking if transaction is a duplicate on a listing")
        var transaction_already_made_on_listing = false;
        for (var key in user.current_transactions_ids) {
            console.log("entering for loop");
            try {
                var transaction = active_transactions.get(user.current_transactions_ids[key]);
                if(transaction != undefined) {
                    if (transaction.listing_id.toString() == listing_id.toString()) {
                        console.log("the user has already made a transaction on this listing")
                        error_handler("You have already made a transaction on this listing");
                        return;
                    }
                }
            } catch (e) {
                error_handler(e.message)
            }
        }
        if(active_transactions.getAllForUser(user_id).length >= 8){
            error_handler("You are involved in too many transactions, please complete some of your current transactions before making new ones");
            return;
        }
        var listing = active_listings.get(listing_id);
        if(active_transactions.getAllForUser(listing.user_id).length >= 8){
            error_handler("The other user is currently involved in too many transactions");
            return;
        }
        console.log("no duplicate found calling makeTransaction")
        makeTransaction(user_id, listing_id, function (transaction) {
                console.log("user that made that transaction (is the transaction_id in current_transaciton ids?:");
                console.log(active_users.get(user_id));
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
                //Set 60 second time to respond to transaction_request
                setTimeout(function(){
                    var transaction = active_transactions.get(new_transaction._id);
                    if(transaction != undefined) {
                        var other_user_id = transaction.getOtherUserId(user_id);
                        var collection = database.collection('users');
                        collection.find({_id: new require('mongodb').ObjectID(other_user_id.toString())}).toArray(function(err, docs) {
                            if (docs.length > 0) {
                                //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                                var user = new User();
                                user.initFromDatabase(docs[0]);
                                if (transaction.isAccepted() != true) {
                                    declineTransactionRequest(user._id, user.password, transaction._id, function () {
                                        emitEvent("transaction_request_declined",  {transaction_id: transaction._id.toString(), user_id: user._id}, [other_user_id, user_id]);
                                        console.log("transaction declined due to exceeding time limit for response")
                                    }, error_handler);
                                }
                            }
                            else {
                                error_handler("user with user_id " + other_user_id + " was not found");
                            }
                        });
                    }
                }, 60000 * 10)
                var user = active_users.get(user_id);
                try{
                    user.addCurrentTransactionId(new_transaction._id);
                    updateUserInDatabase(user, function(){

                    }, error_handler)
                }catch(e){
                    error_handler(e.message);
                }
                //adds transaction_id to user that initiates
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
                            console.log(new_transaction);
                            console.log("transaction added and initialized from database");
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
            error_handler("unable to find transaction with transaction_id: " + transaction_id);
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
        console.log("transaction.acceptRequest called");
        var listing = active_listings.get(transaction.listing_id);
        //throws error if transaction_id has already been set
        //or listing has already been deleted, means listing has already been accepted
        if(listing == undefined || listing.transaction_id != null){
            error_handler("user with user id " + user_id + "has already accepted another transaction for this listing");
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
                updateUserInDatabase(user, function(){}, error_handler)
                transaction.start_time = new Date().getTime();
                updateTransactionInDatabase(transaction, function(){}, function(){});
                callback(transaction);
            }
        }, error_handler)
        // updateListingInDatabase(listing, function(){
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

function declineTransactionRequest(user_id, password, transaction_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        // console.log(active_transactions.getAll());
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
        transaction.active = false;
        //update transaction in database before deleting it so we have a record of the failed transaction
        updateTransactionInDatabase(transaction, function(){
            console.log("updateTransaction completed");
            console.log(transaction)
            //send message to user that initiated request that request was declined
            // remove transaction_id from initiating user (transaction_id was never added to declining user)
            var buyer = active_users.get(transaction.buyer_user_id);
            var seller = active_users.get(transaction.seller_user_id);
            if(transaction.buyer_accepted_request == true){
                try{
                    if(buyer != undefined){
                        buyer.removeCurrentTransactionId(transaction_id);
                        updateUserInDatabase(buyer, function(){

                        }, error_handler)
                    }
                }catch(e){
                    error_handler(e.message)
                }
            }
            else{
                try {
                    if(seller != undefined) {
                        seller.removeCurrentTransactionId(transaction_id);
                        updateUserInDatabase(seller, function(){

                        }, error_handler)
                    }
                }catch(e){
                    error_handler(e.message);
                }
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

function confirmTransaction(user_id, password, transaction_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        if(transaction == undefined){
            error_handler("confirmTransaction: transaction with id " + transaction_id + " was not found");
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
            transaction.end_time = new Date().getTime();
            transaction.active = false;
            updateTransactionInDatabase(transaction, function(){
                console.log("updateTransaction completed");
                console.log(transaction)
                var user1 = active_users.get(transaction.buyer_user_id);
                var user2 = active_users.get(transaction.seller_user_id);
                try {
                    if (user1 != undefined) {
                        user1.removeCurrentTransactionId(transaction_id);
                        updateUserInDatabase(user1, function(){

                        }, error_handler)
                    }
                }catch(e){ console.log(e.message)}
                try {
                    if (user2 != undefined) {
                        user2.removeCurrentTransactionId(transaction_id);
                        updateUserInDatabase(user2, function(){

                        }, error_handler)
                    }
                }catch(e){console.log(e.message)}
                try {
                    active_transactions.remove(transaction_id);
                }catch(e){console.log(e.message)}
                callback(transaction);
            }, error_handler)
        }
        else{
                updateTransactionInDatabase(transaction, function () {
                    callback(transaction);
                }, error_handler);

        }
    }, error_handler);
}

//1. authenticate, same as above
//2. get transaction, same as above
//3. reject the transaction (call reject on the transaction), passing in user_id
//4. check if transaction has completed, if so run appropriate methods

function terminateTransaction(user_id, password, transaction_id, callback, error_handler){
    authenticate(user_id, password, function(user){
        var transaction = active_transactions.get(transaction_id);
        if(transaction == undefined){
            error_handler("terminateTransaction: transaction with id " + transaction_id + " was not found");
            return;
        }
        try{
            transaction.terminate(user_id)
        }catch(e){
            error_handler(e.message);
            return;
        }
            transaction.active = false;
            transaction.end_time = new Date().getTime();
        try {
            updateTransactionInDatabase(transaction, function () {
                console.log(transaction)
                var user1 = active_users.get(transaction.buyer_user_id);
                var user2 = active_users.get(transaction.seller_user_id);
                if (user1 != undefined) {
                    try {
                        user1.removeCurrentTransactionId(transaction_id);
                        updateUserInDatabase(user1, function(){

                        }, error_handler)
                    }catch(e){
                        console.log(e.message)
                    }
                }
                if (user2 != undefined) {
                    try{
                        user2.removeCurrentTransactionId(transaction_id);
                        updateUserInDatabase(user2, function(){

                        }, error_handler)
                    }catch(e){
                        console.log(e.message)
                    }
                }
                try {
                    active_transactions.remove(transaction_id);
                }catch(e){console.log(e.message)}
                console.log("Transaction terminated");
                callback(transaction);
            }, error_handler)
        }catch(e){
            error_handler(e.message)
        }
    }, error_handler)
}

//1. authenticate
//2. validate the location
//3. update the users location to the new_location
function updateUserLocation(user_id, password, new_location, callback, error_handler){
    authenticate(user_id, password, function(user){
        if(validateLocation(new_location) == ""){
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

function updateVenmoId(user_id, venmo_id, callback, error_handler) {
    var user = active_users.get(user_id);
    if (user != undefined) {
        user.venmo_id = venmo_id;
        updateUserInDatabase(user, function(){
            callback(venmo_id);
        }, error_handler)
    }
    else{
        error_handler("user is undefined i.e not logged in, cannot set venmo_id");
    }
}

function updateProfilePicture(user_id, profile_picture, callback, error_handler){
    var collection_profile_pictures = database.collection('profile_pictures');
    // console.log(typeof profile_picture);
    // console.log(profile_picture);
    collection_profile_pictures.update({user_id: user_id}, {user_id: user_id, profile_picture: profile_picture}, {upsert: true}, function (err, count, status) {
        if(err){error_handler(err.message);}
        else{
            if(callback != undefined && callback != null){callback();}
        }
    });
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
                var message = transaction.sendChatMessage(user, message_text);
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

function getListingsWithHashTag(hash_tag, callback, error_handler){
    try {
        var listings = active_listings.getListingsWithHashTag(hash_tag);
    }catch(e){
        error_handler(e.message);
        return;
    }
    callback(listings);
}

function getUsersActiveTransactions(user_id, password, callback, error_handler){
    authenticate(user_id, password, function(user){
        var users_active_transactions = active_transactions.getAllForUser(user._id);
        callback(users_active_transactions);
    }, error_handler);
}

function getUsersPreviousTransactions(user_id, callback, error_handler){
    var collection_transactions = database.collection('transactions');
    // var mongo = new require('mongodb');
    // var user_id = mongo.ObjectID(user_id.toString())
    collection_transactions.find({active: false, buyer_accepted_request: true, seller_accepted_request: true, $or: [{buyer_user_id: user_id}, {seller_user_id: user_id}]}).toArray(function(err, docs){
        if(err){error_handler(err.message);}
        else{
            //retrieves all transactions where active = false from database and sends it back in array;
            var previous_transactions_arr = [];
            for(var i=0; i<docs.length; i++){
                var transaction = new Transaction();
                transaction.initFromDatabase(docs[i]);
                previous_transactions_arr.push(transaction);
            }
            callback(previous_transactions_arr);
        }
    });
}

//Finds user in active_users if not found, searches database, returns a UserInfo object made from the User
function getUser(user_id, callback, error_handler){
    var user = active_users.get(user_id);
    //if user is not in active_users, search database
    if(user == undefined){
        var collection = database.collection('users');
        collection.find({_id: new require('mongodb').ObjectID(user_id.toString())}).toArray(function(err, docs) {
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

function getProfilePicture(user_id, callback, error_handler){
    var collection = database.collection('profile_pictures');
    collection.find({user_id: user_id}).toArray(function(err, docs) {
        if(err){
            error_handler(err);
        }
        else {
            if (docs.length > 0) {
                //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                //the object that is stored in database has a user_id field and a profile_picture field that stores the binary
                // console.log(docs[0]);
                // console.log(docs[0].profile_picture.buffer)
                callback(docs[0].profile_picture.buffer);
            }
            else {
                // error_handler("getProfilePicture: unable to find profile_picture");
            }
        }
    });
}

function updateTransactionInDatabase(transaction, callback, error_handler){
    console.log("updateTransactionInDatabase called!");
    console.log(transaction);
    var collection_transactions = database.collection('transactions');
    try {
        collection_transactions.update({_id: new require('mongodb').ObjectID(transaction._id.toString())}, transaction, function (err, count, status) {
            if (err) {
                error_handler(err.message);
            }
            else {
                if (callback != undefined && callback != null) {
                    callback();
                }
            }
        });
    }catch(e){
        error_handler(e.message);
    }
}

function updateListingInDatabase(listing, callback, error_handler){
    console.log("updateListingInDatabase called!")
    var collection_listings = database.collection('listings');
    collection_listings.update({_id:new require('mongodb').ObjectID(listing._id.toString())}, listing, function (err, count, status) {
        if(err){error_handler(err.message);}
        else{
            if(callback != undefined && callback != null){callback();}
        }
    });
}

function updateUserInDatabase(user, callback, error_handler){
    console.log("updateUserInDatabase called!")
    var collection = database.collection('users');
    collection.update({_id:new require('mongodb').ObjectID(user._id.toString())}, active_users.get(user._id), function(err, result) {
        if(err){error_handler(err); return;}
        console.log(user.email_address + " has been updated");
        if(callback != undefined){ callback(); }
    });
}

function getActiveListingsFromDatabase(callback, error_handler){
    var collection_listings = database.collection('listings');
    collection_listings.find({active: true}).toArray(function(err, docs){
        if(err){error_handler(err.message);}
        else{callback(docs);}
    });
}

function getActiveTransactionsFromDatabase(callback, error_handler){
    var collection_transactions = database.collection('transactions');
    // console.log(collection_transactions);
    collection_transactions.find({active: true}).toArray(function(err, docs){
        if(err){error_handler(err.message);}
        else{callback(docs);}
    });
}

//**********************************
//**END Client->Server API methods**
//**********************************

function initExpiredListingGarbageCollector(interval_in_milliseconds){
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
            // console.log(active_listings.getExpiredListings());
            removeListing(listing._id, function(listing_id){
                // console.log("Expired Listings After Removal");
                // console.log(active_listings.getExpiredListings());
                var alert = " Your listing '" + listing.title + "' has expired";
                var notification_info = {alert: alert, category: "LISTING_EXPIRED"};
                var user = active_users.get(listing.user_id);
                if(user != undefined){
                    sendNotification(notification_info, user.device_token);
                }
                io.emit("listing_removed", {data: {listing_id: listing_id}});
                console.log("listing with id " + listing_id + " was removed because it has expired");
            }, error_handler);
        }
    }, interval_in_milliseconds);
}
// function recoverUsername(email_address){
//     //TODO: implement details below
//     //query User database for user with the given email address
//     //send email containing username to the email address
// }

//accepts an event string and an array of user_ids, emits the event to each one of those users
//also accepts data which is a javascript object that holds the data that will passed in the event
function emitEvent(event_name, data, user_id_arr){
    for(var i=0; i<user_id_arr.length; i++){
        // console.log(user_id_arr[i]);
        // console.log("user_id_arr.length = " + user_id_arr.length)
        var user = active_users.get(user_id_arr[i]);
        var user_socket;
        if(user != undefined){
            user_socket = io.sockets.connected[user.socket_id];
        }
        var event = new Event(event_name, data, null);
        console.log(event);
        // var event = new Event("transaction_declined", {transaction_id: transaction._id.toString()}, null);

        if(user_socket != undefined) {
            console.log("event emitted to " + user.first_name);
            user_socket.emit(event.name , event.message);
        }
        else{
            if(user != undefined) {
                console.log("event enqueued for " + user.first_name);
                user.enqueueEvent(event);
            }
        }

    }
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

function getActiveUsers(){
    return active_users;
}

function getActiveListings(){
    return active_listings;
}

function getActiveTransactions(){
    return active_transactions;
}

function validateEmail(email_address) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email_address);
}

function validateVanderbiltEmail(email_address){
    var nameString = email_address.substring(0, email_address.indexOf("@"));
    var nameStringSplit = nameString.split(".");
    return nameStringSplit.length >= 2 && nameStringSplit.length <= 3 && /@vanderbilt.edu\s*$/.test(email_address);
}

function validateUsername(username){
    //username must be between 6-20 characters, can only contain alphanumeric and numbers
    //first character must be alphanumeric
    return /^[A-Za-z][A-Za-z0-9]{5,19}$/.test(username);
}

function validatePassword(password){
    //must be atleast 1 character long
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{1,}$/.test(password);
}

//user_id, title, description, location, expiration_time, price, buy

function validateTitle(title){
    // if(!(typeof title == 'string' && /^[A-Za-z0-9\s\-_,\.;:()]+$/.test(title))){
    //     return "That's an invalid title!"
    // }
    if(!(title.length <= 30)){
        return "Title must be less than 30 characters!"
    }
    else if(!( title.length > 0)){
        return "You didn't enter a title!"
    }
    return "";
}

function validateDescription(description){
    if(!(description.length > 0 )){
        return "Looks like you didn't enter a description!"
    }
    else if(!(description.length <= 140)){
        return "Description must be 140 characters or less!"
    }
    else{
        return "";
    }
}

function validateLocation(location){
    if(!((typeof location == 'object') && (location.latitude != undefined) && (location.longitude != undefined) && (typeof location.latitude == 'number') && (typeof location.longitude == 'number'))){
        return "Please enter a valid location!"
    }
    else{
        return "";
    }
}


function validateExpirationTime(expiration_time){
    // return typeof expiration_time == 'number' && expiration_time >= new Date().getTime() && expiration_time <= 1606243112000;
    if(!(typeof expiration_time == 'number')) {
        return "Please enter a valid date!";
    }else if( !(expiration_time >= new Date().getTime())){
        return "You can't go back in time! Set a time in the future!"
    }else if(!(expiration_time <= new Date().getTime() + 86400000 * 7)){
       return "Set a time within the next week!"
    }
    else{
        return "";
    }

}

//returns a string if "" then no error otherwise its an error
function validatePrice(price){
    if(!typeof price == 'number'){
        return "Price must be a number!"
    }
    else if(!(price >= 0)){
        return "You can't make the price less than free! "
    }
    else if(!(price <= 10000)){
        return "You can only buy or sell items of value less than or equal to $10000!"
    }
    else{
        return "";
    }
}

function validateBuy(buy){
    console.log("typeofbuy == " + (typeof buy));
    // return typeof buy == 'boolean';
    return "";
}

function getUUID(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function sendNotification(notification_info, device_token){
    // Enter the device token from the Xcode console
    var deviceToken = device_token;
    console.log(device_token);

    // Prepare a new notification
    var notification = new apn.Notification();
    // Specify your iOS app's Bundle ID (accessible within the project editor)
    notification.topic = 'bowen.jin.mealplanappiOS';
    // Set expiration to 1 hour from now (in case device is offline)
    notification.expiry = Math.floor(Date.now() / 1000) + 3600;
    notification_info.badge = 0;
    // Set app badge indicator
    if(notification_info.badge != undefined){
        notification.badge = notification_info.badge;
    }
    if(notification_info.sound != undefined){
        notification.sound = notification_info.sound;
    }
    else{
        notification.sound = "default";
    }
    if(notification_info.alert != undefined){
        notification.alert = notification_info.alert;
    }
    if(notification_info.payload != undefined){
        notification.payload = notification_info.payload;
    }
    if(notification_info.category != undefined){
        notification.category = notification_info.category;
    }
    // Actually send the notification
    apnProvider.send(notification, deviceToken).then(function(result) {
        // Check the result for any failed devices
        console.log(result);
    });
}



