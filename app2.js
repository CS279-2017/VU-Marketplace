var http = require('http');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var apn = require('apn');

var request = require("request");


const crypto = require('crypto');
const secret = 'vandylistisawesome';

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = require('mongodb').MongoClient;
// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://localhost:27017/mealplanappserver';
// var url = 'mongodb://heroku_g6cq993c:f5mm0i1mjj4tqtlf8n5m22e9om@ds129018.mlab.com:29018/heroku_g6cq993c'
//database stores an instance of a connection to the database, will be initialized on server startup.
var database;

//import classes
var User = require("./classes/user2.js");
var Message = require("./classes/message2.js");
var Listing = require("./classes/listing2.js");
var Book = require("./classes/book2.js");
var Notification = require("./classes/notification2.js");

var UsersCollection = require("./classes/users_collection")
var ListingsCollection = require("./classes/listings_collection")
var MessagesCollection = require("./classes/messages_collection")


// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
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

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var port = process.env.PORT || 3000;

var max_listings = 16;
var max_transactions = 32;
var max_pictures_per_listing = 5;

var transaction_expiration_time_in_minutes = 60*24;

var max_picture_size = 700000

var host = "";

var listings_collection;
var users_collection;
var messages_collection;

server.listen(port,function () {
    host = server.address().address
    if(host == "::"){
        host = "localhost"
    }

    console.log('Example app listening at http://%s:%s', host, port)

    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the server. Error:' + err);
            return;
        }
        database = db;
        users_collection = new UsersCollection(db);
        listings_collection = new ListingsCollection(db);
        messages_collection = new MessagesCollection(db);
    });
});

app.get('/', function (req, res) {
    res.send('If you have any questions about VandyList, please email mealplanapp@gmail.com');
});

// app.get('/reset_password/', function(req, res){
//     var query = req.query;
//     var reset_password_verification_code = query.reset_password_verification_code;
//     var email_address = query.email_address
//     resetPasswordVerificationCode(verification_code, email_address)
//
// });
io.on('connection', function (socket) {
    socket.on('disconnect', function() {
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
        var password = json.password;
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

    socket.on('reset_password_email_address', function(json) {
        var email_address = json.email_address.toLowerCase();
        var callback = function (verification_code, email_address) {
            socket.emit('reset_password_email_address_response', {data: null , error: null});
        };
        var error_handler = function (e) {
            socket.emit('reset_password_email_address_response', {data: null , error: e})
            console.log(e);
            return;
        }
        resetPasswordEmailAddress(email_address, callback, error_handler)
    });

    socket.on('reset_password_verification_code', function(json){
        var verification_code = json.verification_code;
        var password = json.password;
        var email_address = json.email_address.toLowerCase();
        var callback = function(){
            socket.emit("reset_password_verification_code_response", {data: null, error: null});
        };
        var error_handler = function(e) {
            socket.emit("reset_password_verification_code_response", {data: null, error: e});
            console.log(e);
        }
        resetPasswordVerificationCode(verification_code, email_address, password, callback, error_handler);
    });

    socket.on('login', function(json){
        var email_address = json.email_address.toLowerCase();
        var password = json.password;
        var device_token = json.device_token;

        var callback = function(user){
            user.socket_id = socket.id; //store the socket_id of the user upon login and authentication
            user.device_token = device_token;
            updateUserInDatabase(user, function(){
                console.log("new device token: " + user.device_token + " for " + user.first_name + " " + user.last_name);
                socket.emit("login_response", {data: {user_id: user._id}, error: null});
            }, error_handler)
        };
        var error_handler = function(e) {
            socket.emit("login_response", {data: null, error: e});
            console.log(e);
        }
        //TODO: should we allow logging in from multiple devices at once? for now yes
        login(email_address, password, device_token, callback, error_handler);
    });

    socket.on('logout', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token
        function callback(){
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
        logout(user_id, password, device_token, callback, error_handler);
    });

    socket.on('authenticate', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token;

        function callback(user){
            user.socket_id = socket.id; //store the socket_id of the user upon login and authentication
            socket.emit('authenticate_response', {data: null, error: null});
            console.log("authenticated " + user.first_name + " " + user.last_name)
        }
        function error_handler(e){
            socket.emit('authenticate_response', {data: null, error:e});
            console.log(e);
        }
        
        if(users_collection != undefined){
            users_collection.get([user_id], function(user){
                if(user != undefined && (device_token != user.device_token)){
                    error_handler("tried to authenticate an invalid user_id/password combination");
                }
                else {
                    // console.log("entered device_token: " + device_token);
                    authenticate(user_id, password, device_token, callback, error_handler);
                }
            });
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
        var device_token = json.device_token

        var book = json.book;
        var description = json.description;
        var price = json.price;

        // var location = json.location;
        // var expiration_time = json.expiration_time;
        // var title = json.title;
        // var isbn13 = json.isbn13
        // var author_names = json.author_names;
        // var buy = false;
        
        authenticate(user_id, password, device_token, function(user){
            var error_string = "";
            if(validateDescription(description) != ""){
                error_string += (validateDescription(description) + "\n");
            }
            else if(validatePrice(price) != ""){
                error_string += (validatePrice(price) + "\n");
            }
            if(error_string != ""){
                error_handler(error_string);
                return;
            }
            var new_listing = new Listing(user_id, book, description, price);
            // var new_listing = new Listing(user_id, title, description, location, expiration_time, price, buy, isbn13, author_names);
            users_collection.get(user_id, function(user){
                new_listing.first_name = user.first_name;
                new_listing.last_name = user.last_name;
                listings_collection.add(new_listing, function(listing){
                    console.log(listing);
                    callback(listing);
                }, error_handler)
            })

        }, error_handler)
        
        function callback(listing){
            socket.emit("make_listing_response", {data: {listing: listing}, error: null});
            io.emit("listing_made", {data: {listing: listing}});
        }
        function error_handler(e){
            socket.emit("make_listing_response", {data: null, error: e});
            console.log(e);
        }
    });

    socket.on('update_listing', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var listing_id = json.listing_id
        var title = json.title;
        var description = json.description;
        var location = json.location;
        var expiration_time = json.expiration_time;
        var price = json.price;
        var buy = json.buy;

        authenticate(user_id, password, device_token, function(user){
            listings_collection.get(listing_id, function(listing){
                var new_listing = new Listing(user_id, title, description, location, expiration_time, price, buy);
                if(user._id.toString() == listing.user_id.toString()){
                    if(new_listing != undefined && listing != undefined) {

                        listing.update(new_listing);
                        listings_collection.add(listing, function(listing){
                            if(callback != undefined && callback != null){callback(listing);}
                        }, error_handler)
                    }
                }
                else {
                    error_handler("This listing doesn't belong to you!");
                }
            });

        }, error_handler)
        
        function callback(listing){
            socket.emit("update_listing_response", {data: {listing: listing}, error: null});
            //emit event to all users that a new listing has been made
            users_collection.get(listing.user_id, function(user){
                console.log("Listing with title " + listing.title + " was updated by " + user.first_name + " " + user.last_name)
                io.emit("listing_updated", {data: {listing: listing}});
            });
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
        var device_token = json.device_token

        var listing_id = json.listing_id
        var callback = function(listing_id){
            socket.emit("remove_listing_response", {data: {listing_id: listing_id}, error: null})
            //notify all users that listing_id has been removed;
            io.emit("listing_removed", {data: {listing_id: listing_id}});
        };
        var error_handler = function(e) {
            socket.emit("remove_listing_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, device_token, function(user){
            listings_collection.get(listing_id, function(listing){
                if(listing != undefined){
                    if(listing.user_id.toString() == user_id.toString()){
                        console.log("Listing '" + listing.title + "' was removed by " + user.first_name + " " + user.last_name);
                        listings_collection.get(listing_id, function(listing){
                            if(listing != undefined) {
                                listing.removed_time = new Date().getTime();
                                listing.active = false; //deactivate the listing
                                listing.add(listing, function(listing){
                                    callback(listing);
                                }, error_handler)
                            }
                        });
                        console.log("removeListing called");
                    }
                    else{
                        error_handler("user_id doesn't match user_id of user who created the listing, unable to delete listing");
                    }
                }
                else{
                    error_handler("listing was not found in listings_collection");
                }
            });


        }, error_handler);
    });

    socket.on('get_listings', function(json){
        var listing_ids = json.listing_ids;
        function callback(listing){
            //send all_listings_collection back to client
            socket.emit("get_listing_response", {data: {listings: listings}, error: null});
        }
        function error_handler(e){
            socket.emit("get_listing_response", {data: null, error: e});
            console.log(e);
        }
        listings_collection.get(listing_ids, function(listings){
            callback(listings);
        }, error_handler);
    });

    socket.on('get_listings_with_isbn', function(json){
        // var login_info = json.login_info;
        var isbn13 = json.isbn13;
        // authenticate()

        function callback(listings){
            socket.emit("get_listings_with_isbn_response", {data: {listings: listings}, error: null})
        }
        function error_handler(e){
            socket.emit("get_listings_with_isbn_response", {data: null, error: e})
        }
        try {
            listings_collection.getListingsWithBookIsbn(isbn13, function(listings){
                callback(listings);
            });
        }catch(e){
            error_handler(e.message);
            return;
        }
    });

    socket.on('get_listings_with_user_id', function(json){
        // var login_info = json.login_info;
        var user_id = json.user_id;
        // authenticate()

        function callback(listings){
            socket.emit("get_listings_with_user_id_response", {data: {listings: listings}, error: null})
        }
        function error_handler(e){
            socket.emit("get_listings_with_user_id_response", {data: null, error: e})
        }
        try {
            listings_collection.getListingsWithUserId(user_id, function(listings){
                callback(listings);
            });
        }catch(e){
            error_handler(e.message);
            return;
        }
    });

    socket.on('get_conversation', function(json){
        var user_id = json.user_id;
        var other_user_id = json.other_user_id;

        function callback(conversation){
            socket.emit("get_conversation_response", {data: {conversation: conversation}, error: null})
        }
        function error_handler(e){
            socket.emit("get_conversation_response", {data: null, error: e})
        }
        try {
            messages_collection.getConversation(user_id, other_user_id, function(conversation){
                callback(conversation);
            }, error_handler);
        }catch(e){
            error_handler(e.message);
            return;
        }
    })
    
    socket.on('update_user_location', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var new_location = json.new_location;

        authenticate(user_id, password, device_token, function(user){
            if(validateLocation(new_location) == ""){
                //transform the ordered pair into a Location object (regardless of whether it was a Location or just a normal
                //object)
                user.location = new Location(new_location.latitude, new_location.longitude);
                updateUserInDatabase(user, function(){
                    callback(user.location);
                }, error_handler)
            }
            else{
                error_handler("the location passed to update_user_location is invalid");
            }
        }, error_handler)
        
        function callback(updated_location){
            socket.emit("update_user_location_response", {data: {updated_location: updated_location}, error: null});
            //notify all users, or all users in the same transaction with user whose location was updated,
            users_collection.get(user_id, function(user){
                io.emit("user_location_updated", {
                    data: {
                        user_id: user._id.toString(),
                        transaction_id: null,
                        updated_location: updated_location
                    }, error: null
                });

            });

        }
        function error_handler(e){
            socket.emit("update_user_location_response", {data: null, error: e});
            // console.log(e);
        }
    });

    socket.on('update_venmo_id', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token
        var venmo_id = json.venmo_id;
        function callback(updated_venmo_id){
            socket.emit("update_venmo_id_response", {data: {updated_venmo_id: updated_venmo_id}, error: null});
            //notify all users, or all users in the same transaction with user whose venmo_id was updated,
            var user = users_collection.get(user_id, function(user){
                try {
                    getUserInfo(user_id, function(user_info){
                        console.log(user_info.first_name + " " + user_info.last_name + " updated his/her venmo_id")
                    }, function(){})
                    io.emit("venmo_id_updated", {data: {user_id: user._id, venmo_id: venmo_id}, error: null});

                }catch(e){
                    console.log(e.message);
                    error_handler(e.message);
                    return;
                }
            });
            // var current_transaction_ids = user.current_transactions_ids;

        }
        function error_handler(e){
            socket.emit("update_venmo_id_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, device_token, function(user){
            users_collection.get(user_id, function(user){
                if (user != undefined) {
                    user.venmo_id = venmo_id;
                    updateUserInDatabase(user, function(){
                        callback(venmo_id);
                    }, error_handler)
                }
                else{
                    error_handler("user is undefined i.e not logged in, cannot set venmo_id");
                }
            });
        })
    });

    socket.on('update_profile_picture', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token
        var profile_picture = json.profile_picture;

        authenticate(user_id, password, device_token, function(user){
            updateProfilePicture(user_id, profile_picture, callback, error_handler)
        }, error_handler)

        function callback(){
            socket.emit("update_profile_picture_response", {data: null, error: null});
            io.emit("profile_picture_updated", {data: {user_id: user_id}, error: null});
            getUserInfo(user_id, function(user_info){
                console.log(user_info.first_name + " " + user_info.last_name + " updated his/her profile picture")
            }, function(){})
        }

        function error_handler(e){
            socket.emit("update_profile_picture_response", {data: null, error: e});
            console.log(e);
        }
    });

    socket.on('get_profile_pictures', function(json){
        var user_id = json.user_ids;
        function callback(profile_pictures){
            socket.emit("get_profile_picture_response", {data: {profile_picture: profile_pictures}, error: null});
            // socket.emit("profile_picture_gotten", {data: {user_id: user_id.toString(), profile_picture: profile_picture}, error: null});
            var end = new Date().getTime();
            console.log("getProfilePicture time taken: " + (end - start));
        }
        function error_handler(e){
            socket.emit("get_profile_picture_response", {data: null, error: e});
            console.log(e);
        }
        var start = new Date().getTime();
        // getProfilePictures(user_ids, callback, error_handler);
    });

    socket.on('update_picture', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var picture_id = json.picture_id;
        var picture = json.picture;

        getUserInfo(user_id, function(user_info){
            console.log(user_info.first_name + " " + user_info.last_name + " called update_picture")
        }, function(){})
        authenticate(user_id, password, device_token, function(user){
            updatePicture(picture_id, user_id, picture, callback, error_handler)
        }, error_handler)

        function callback(){
            getUserInfo(user_id, function(user_info){
                console.log(user_info.first_name + " " + user_info.last_name + " updated a picture")
            }, function(){})
            socket.emit("update_picture_response", {data: null, error: null});
            io.emit("picture_updated", {data: {picture_id: picture_id}, error: null});
        }

        function error_handler(e){
            socket.emit("update_picture_response", {data: null, error: e});
            console.log(e);
        }
    });

    socket.on('add_picture_to_listing', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var listing_id = json.listing_id
        var picture = json.picture;
        authenticate(user_id, password, device_token, function(user){
            addPictureToListing(listing_id, user_id, picture, callback , error_handler)
        });

        function callback(){
            socket.emit("add_picture_to_listing_response", {data: null, error: null});
            listings_collection.get(listing_id, function(listing){
                if(listing != undefined){
                    io.emit("listing_updated", {data: {listing: listing}});
                }
                getUserInfo(user_id, function(user_info){
                    console.log(user_info.first_name + " " + user_info.last_name + " added a picture to the listing '" + listing.title + "'");
                }, function(){})
            });

        }

        function error_handler(e){
            socket.emit("add_picture_to_listing_response", {data: null, error: e});
            console.log(e);
        }
    });

    socket.on('delete_picture_from_listing', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var listing_id = json.listing_id
        var picture_id = json.picture_id;
        authenticate(user_id, password, device_token, function(user){
            deletePictureFromListing(picture_id, listing_id, user_id, callback, error_handler)
        });

        function callback(){
            socket.emit("delete_picture_from_listing_response", {data: null, error: null});
            listings_collection.get(listing_id, function(listing){
                if(listing != undefined){
                    io.emit("listing_updated", {data: {listing: listing}});
                }

                getUserInfo(user_id, function(user_info){
                    console.log(user_info.first_name + " " + user_info.last_name + " deleted a picture from the listing '" + listing.title + "'");
                }, function(){})
                // socket.emit("picture_added_to_listing", {data: {listing_id: listing_id}, error: null});
            });

        }

        function error_handler(e){
            socket.emit("delete_picture_from_listing_response", {data: null, error: e});
            console.log(e);
        }
    });

    socket.on('get_picture', function(json){
        var start = new Date().getTime();
        var picture_id = json.picture_id;
        function callback(picture){
            socket.emit("get_picture_response", {data: {picture_id: picture_id.toString(), picture: picture}, error: null});
            // socket.emit("picture_gotten", {data: {picture_id_id: picture_id.toString(), picture: profile_picture}, error: null});
            // console.log("emitting profile_picture_gotten took " + (end1 - start1) + " milliseconds.")
            var end = new Date().getTime();
            console.log("getPicture execution time: " + (end - start));
        }
        function error_handler(e){
            socket.emit("get_picture_response", {data: null, error: e});
            console.log(e);
        }
        getPicture(picture_id, callback, error_handler);
    })
    
    socket.on('send_message', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token
        var to_user_id = json.to_user_id;
        var message_text = json.message_text;

        function callback(message){
            socket.emit("send_message_response", {data: {message: message}, error: null});
        }
        function error_handler(e){
            socket.emit("send_message_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, device_token, function(user){
            var message = new Message(message_text, user_id, to_user_id);
            messages_collection.add(message, function(message){
                var alert = user.first_name + " " + user.last_name + ": " + message_text;
                var notification_info = {alert: alert, category: "MESSAGE_SENT", payload: {from_user_id: user_id, to_user_id: to_user_id}};
                emitEvent("message_sent", message, [to_user_id], notification_info);
                callback(message);
            }, error_handler)
        }, error_handler)
    })

    // socket.on('send_chat_message', function(json){
    //     var user_id = json.user_id;
    //     var password = json.password;
    //     var device_token = json.device_token
    //     var transaction_id = json.transaction_id;
    //     var message_text = json.message_text;
    //     function callback(message){
    //         socket.emit("send_chat_message_response", {data: null, error: null});
    //         //notify all user in the transaction that a new message has been sent
    //         try {
    //             active_transactions.get(transaction_id, function(transaction){
    //                 emitEvent("chat_message_sent", {transaction_id: transaction_id, message: message}, [transaction.buyer_user_id, transaction.seller_user_id])
    //                 // var buyer = transaction.buyer_user_id;
    //                 // var seller = transaction.seller_user_id;
    //                 // var buyer_socket = io.sockets.connected[buyer.socket_id];
    //                 // var seller_socket = io.sockets.connected[seller.socket_id];
    //                 // buyer_socket.emit("chat_message_sent", {data: {transaction_id: transaction_id, message: message}, error: null});
    //                 // seller_socket.emit("chat_message_sent", {data: {transaction_id: transaction_id, message: message}, error: null});
    //                 users_collection.get(user_id, function(user){
    //                     var other_user_id = transaction.getOtherUserId(user_id);
    //                     users_collection.get(other_user_id, function(other_user){
    //                         var other_user_socket = undefined
    //                         if(other_user != undefined){
    //                             other_user_socket = io.sockets.connected[other_user.socket_id];
    //                         }
    //                         // if(other_user_socket == undefined){
    //                         var alert = user.first_name + " " + user.last_name + ": " + message_text;
    //                         var notification_info = {alert: alert, category: "CHAT_MESSAGE_SENT", payload: {transaction_id: transaction._id.toString()}};
    //                         if(other_user != undefined) {
    //                             sendNotification(notification_info, other_user.device_token, user._id, transaction._id);
    //                         }
    //                         // }
    //                         getUserInfo(user_id, function(user_info){
    //                             console.log(user_info.first_name + " " + user_info.last_name + ": '" + message.text +"'");
    //                         }, function(){})
    //                     });
    //                 });
    //             });
    //
    //         }catch(e){
    //             console.log(e);
    //             return;
    //         }
    //     }
    //     function error_handler(e){
    //         console.log(e);
    //     }
    //     sendChatMessage(user_id, password, device_token, transaction_id, message_text, callback, error_handler)
    // });

    socket.on('get_users_active_notifications', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token
        function callback(users_active_notification){
            //send all_listings_collection back to client

            socket.emit("get_users_active_notifications_response", {data: {users_active_notifications: users_active_notification}, error: null});
        }
        function error_handler(e){
            socket.emit("get_users_active_notifications_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, device_token, function(user){
            getUsersActiveNotifications(user_id, callback, error_handler)
        }, error_handler);
    });

    socket.on('deactivate_notification', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token
        var notification_id = json.notification_id
        function callback(){
            //send all_listings_collection back to client
            socket.emit("deactivate_notification_response", {data: null, error: null});
        }
        function error_handler(e){
            socket.emit("deactivate_notification_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, device_token, function(user){
            getNotification(notification_id, function(notification){
                if(notification.user_id == user_id){
                    deactivateNotification(notification_id, callback, error_handler)
                }
            }, function(error){console.log(error)})
        }, error_handler);
    });



    socket.on('get_users', function(json){
        var user_ids = json.user_ids;
        function callback(users){
            //send all_listings_collection back to client
            socket.emit("get_user_response", {data: {users: users}, error: null});
        }
        function error_handler(e){
            socket.emit("get_user_response", {data: null, error: e});
            console.log(e);
        }
        users_collection.get(user_ids, function(users){
            callback(users);
        }, error_handler);
    });


    socket.on('search_books', function(json){
        console.log("search_books called!")
        var search_query = json.search_query;
        var api_key = "4MCC8UA5"
        var request_url = "http://isbndb.com/api/v2/json/" + api_key + "/books?q=" + search_query;
        console.log(request_url);
        request(request_url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var books = [];
                var json = JSON.parse(body)
                var data = json.data;
                // console.log(data.length);
                if(data != undefined){
                    for(var i=0; i<data.length; i++){
                        var book = new Book(data[i]);
                        console.log(book);
                        books.push(book);
                    }
                }
                console.log("search_books_response success!")
                socket.emit("search_books_response", {data: {books: books}, error: null});
            }
            else{
                console.log("search_books_response failure!")
                socket.emit("search_books_response", {data: null, error: "Search Query Failed"});
            }
        });
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
                from: '"VandyList" <mealplanapp@gmail.com>', // sender address
                to: email_address, // list of receivers
                subject: 'Verification Code for VandyList', // Subject line
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
    //adds a function to String prototype to capitalize first letter
    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
    email_address = email_address.toLowerCase(); //converts email_address to lower_case because email_addresses are case insensitive
    if(!validateEmail(email_address)){
        error_handler("invalid email_address");
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
    else if(nameStringSplit.length == 4){
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
    //hashes password
    password = hashPassword(password);
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

function resetPasswordEmailAddress(email_address, callback, error_handler){
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
                    var email = {email_address: email_address, registered: docs[0].registered, verification_code: docs[0].verification_code, reset_password_verification_code: verification_code}
                    //adding unique index on email_address ensures no duplicate email_addresses
                    collection.update({email_address: email_address}, email, function (err, result) {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            console.log('Inserted reset password verification code ' + verification_code + ' into the email database under email address ' + email_address)
                            sendEmail(email_address, verification_code);
                            callback()
                        }
                    });
                }
                else{
                    error_handler("This email address has not been registered")
                }
            }
            else{
                error_handler("This email address has not been registered")
            }
            //adds the verification code and email to database
            //TODO: For testing purposes, dont actually send emails!

        });
        function sendEmail(email_address, verification_code){
            // setup e-mail data with unicode symbols
            // var mailOptions = {
            //     from: '"VandyList" <mealplanapp@gmail.com>', // sender address
            //     to: email_address, // list of receivers
            //     subject: 'Reset Password Verification Link for VandyList', // Subject line
            //     text: 'Reset Password Verification Link: <a href="http://' + host + ':' + port + 'reset_password?reset_password_verification_code=' +
            //     verification_code + '&email_address=' + email_address + '>Click Here</a>', // plaintext body
            // };
            var mailOptions = {
                from: '"VandyList" <mealplanapp@gmail.com>', // sender address
                to: email_address, // list of receivers
                subject: 'Reset Password Verification Code for VandyList', // Subject line
                text: 'Reset Password Verification Code: ' + verification_code, // plaintext body
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

function resetPasswordVerificationCode(verification_code, email_address, password, callback, error_handler){
    //adds a function to String prototype to capitalize first letter
    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
    password = hashPassword(password);
    email_address = email_address.toLowerCase(); //converts email_address to lower_case because email_addresses are case insensitive
    var collection_emails = database.collection('emails');
    collection_emails.find({email_address: email_address}).toArray(function(err, docs) {
        if(docs.length > 0) {
            //checks that verification_code is valid and email hasn't already been registered
            if(docs[0].reset_password_verification_code == verification_code){
                if(docs[0].registered == true){
                    users_collection.getForEmailAddress(email_address, function(user){
                        if(user != undefined){
                            user.password = password;
                        }
                        var collection_users = database.collection('users');
                        collection_users.update({email_address:email_address}, {$set: {password : password}}, function(err, result) {
                            if(err){
                                error_handler(err);
                                return;
                            }
                            callback();
                        });
                    });

                }
                else{
                    error_handler(email_address + " hasn't been");
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
}


function login(email_address, password, device_token, callback, error_handler){
    password = hashPassword(password);
    email_address = email_address.toLowerCase();
    //query database for user with given email_address and password
    console.log("login called");
    var collection = database.collection('users');
    collection.find({email_address: email_address, password: password}).toArray(function(err, docs) {
        if(err){
            error_handler(err);
        }
        if(docs.length > 0) {
            //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
            var user = new User();
            user.update(docs[0]);
            user.active = true;
            user.last_login_time = new Date().getTime();
            user.logged_in = true;
            user.device_token = device_token;
            users_collection.add(user, function(user){
                console.log(user);
                if(callback != undefined){ callback(user); }
            }, error_handler);
        }
        else{
            //if not found: alert user that login failed, because incorrect email_address/password
            error_handler("Incorrect Email Address or Password");
        }
    });
}

//TODO: what if a user logs out during a transaction? while he/she has listings? or he or she has requested a transaction
//TODO: or when he or she has received a transaction?
function logout(user_id, password, device_token, callback, error_handler){
    //verify credentials of user calling logout
    authenticate(user_id, password, device_token, function(user){
        try {
            users_collection.get(user_id, function(user){
                user.active = false;
                user.logged_in = false;
                users_collection.add(user, function(user){
                    console.log(user.first_name + " " + user.last_name + " has logged out");
                    if(callback != undefined){ callback(); }
                }, error_handler)
            });
        }catch(e){
            error_handler(e.message);
            return;
        }
    }, error_handler);
}

function authenticate(user_id, password, device_token, callback, error_handler){
    password = hashPassword(password);
    var authentication_info = {user_id: user_id, password: password, device_token: device_token};
    users_collection.authenticate(authentication_info, callback, error_handler);
}

function validateListing(listing){
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
    return error_string;
}

function updateProfilePicture(user_id, profile_picture, callback, error_handler){
    console.log("profile_picture length " + profile_picture.length)
    if(profile_picture.length <= max_picture_size){
        var collection_profile_pictures = database.collection('profile_pictures');
        collection_profile_pictures.update({user_id: user_id}, {user_id: user_id, profile_picture: profile_picture}, {upsert: true}, function (err, count, status) {
            if(err){error_handler(err.message);}
            else{
                if(callback != undefined && callback != null){callback();}
            }
        });
    }
    else{
        console.log("picture size: " + profile_picture.length)
        error_handler("Picture Size Too Large!")
    }

}

function updatePicture(picture_id, user_id, picture, callback, error_handler){
    console.log("picture size: " + picture.length)
    if(picture.length <= max_picture_size){
        var collection_pictures = database.collection('pictures');
        collection_pictures.find({_id: toMongoIdObject(picture_id)}).toArray(function(err, docs) {
            if(err){
                error_handler(err);
            }
            else {
                if (docs.length > 0) {
                    if(docs[0].user_id == user_id){
                        collection_pictures.update({_id: toMongoIdObject(picture_id)}, {user_id: user_id, picture: picture}, function (err, count, status) {
                            if(err){error_handler(err.message);}
                            else{
                                if(callback != undefined && callback != null){callback();}
                            }
                        });
                    }
                    else{
                        error_handler("This picture doesn't belong to you! Can't update!")
                    }
                }
                else {
                    error_handler("picture with id not found");

                }
            }
        });
    }
    else{
        error_handler("Picture Size Too Large!")
    }

}

function addPictureToListing(listing_id, user_id, picture, callback, error_handler){
    console.log("picture size: " + picture.length)

    if(picture.length <= max_picture_size){
        listings_collection.get(listing_id, function(listing){
            if(listing.user_id != user_id){
                error_handler("You can only add pictures to your own listing!");
                return;
            }
            if(listing != undefined){
                if(listing.picture_ids != undefined && listing.picture_ids.length < max_pictures_per_listing){
                    var collection_pictures = database.collection('pictures');
                    collection_pictures.insert({picture: picture, user_id: toMongoIdObject(user_id)}, function(err,docsInserted){
                        if(err){error_handler(err.message); return;}

                        console.log(docsInserted);
                        listing.addPictureId(docsInserted.ops[0]._id);
                        updateListingInDatabase(listing, callback, error_handler);
                    });
                }
                else{
                    error_handler("You can only add up to " + max_pictures_per_listing + " pictures per listing");
                }
            }
            else{
                error_handler("invalid listing_id");
            }
        });

    }
    else{
        console.log("picture size: " + picture.length)
        error_handler("Picture Size Too Large!")
    }
}

function deletePictureFromListing(picture_id, listing_id, user_id, callback, error_handler){
    listings_collection.get(listing_id, function(listing){
        if(listing.user_id != user_id){
            error_handler("You can only add pictures to your own listing!");
            return;
        }
        listing.removePictureId(picture_id);
        updateListingInDatabase(listing, callback, error_handler);
    });

}

// function sendChatMessage(user_id, password, device_token, transaction_id, message_text, callback, error_handler){
//     authenticate(user_id, password, device_token, function(user){
//         active_transactions.get(transaction_id, function(transaction){
//             if(transaction.buyer_user_id.toString() == user._id.toString() || transaction.seller_user_id.toString() == user_id.toString()){
//                 try {
//                     var message = transaction.sendChatMessage(user, message_text);
//                     updateTransactionInDatabase(transaction, function(){
//                         callback(message);
//                     }, error_handler)
//                 }catch(e){
//                     error_handler(e.message);
//                     return;
//                 }
//             }
//             else{
//                 error_handler("user with user_id " + user_id + " tried to send a message to conversation in a transaction of which he/she is not apart of");
//             }
//         });
//     }, error_handler)
// }

//1. authenticate
//2. get listings_collection
//3. return listings_collection
function getAllActiveListings(user_id, password, device_token, callback, error_handler){
    authenticate(user_id, password, device_token, function(user){
        listings_collection.getAll(function(all_listings_collection){
            callback(all_listings_collection);
        });

    }, error_handler)
}

function getUsersActiveTransactions(user_id, password, device_token, callback, error_handler){
    authenticate(user_id, password, device_token, function(user){
        getUser(user_id, function(user){
            // if(user.password == hashPassword(password)){
            active_transactions.getAllForUser(user._id, function(users_active_transactions){
                console.log(users_active_transactions);
                callback(users_active_transactions);
            });
        }, error_handler)
    }, error_handler);
}

function getUsersActiveListings(user_id, callback, error_handler){
    getUserInfo(user_id, function(user){
        listings_collection.getAllForUser(user._id, function(users_listings_collection){
            callback(users_listings_collection);
        });
    }, error_handler)
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
                transaction.update(docs[i]);
                previous_transactions_arr.push(transaction);
            }
            callback(previous_transactions_arr);
        }
    });
}

function getUserInfo(user_id, callback, error_handler){
    users_collection.get(user_id, function(user){
        if(user == undefined){
            var collection = database.collection('users');
            collection.find({_id: new require('mongodb').ObjectID(user_id.toString())}).toArray(function(err, docs) {
                if (docs.length > 0) {
                    //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                    var user = new User();
                    user.update(docs[0]);
                    var user_info = new UserInfo(user);
                    user_info.logged_in = false;
                    callback(user_info);

                }
                else {
                    error_handler("user with user_id " + user_id + " was not found");
                }
            });
        }
        else{
            var user_info = new UserInfo(user);
            user_info.logged_in = true;
            callback(user_info)
        }
    });

}

function getUser(user_id, callback, error_handler){
    // password = hashPassword(password);
    var collection = database.collection('users');
    collection.find({_id: toMongoIdObject(user_id)}).toArray(function(err, docs) {
        if(docs.length > 0) {
            //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
            var user = new User();
            user.update(docs[0]);
            callback(user)
        }
        else{
            //if not found: alert user that login failed, because incorrect email_address/password
            error_handler("getUser: user was not found for user_id: "+user_id + " password: " + password);
        }
    });
}

function getListing(listing_id, callback, error_handler){
    

}

function getTransaction(transaction_id, callback, error_handler){
    active_transactions.get(transaction_id, function(transaction){
        if(transaction == undefined){
            var collection = database.collection('transactions');
            collection.find({_id: toMongoIdObject(transaction_id)}).toArray(function(err, docs) {
                if (docs.length > 0) {
                    //log user in (create and add a new User object to ActiveUsers), alert client that he's been logged in
                    var transaction = new Transaction();
                    transaction.update(docs[0]);
                    callback(transaction);
                }
                else {
                    error_handler("listing with listing_id " + listing_id + " was not found");
                }
            });
        }
        else{
            callback(transaction)
        }
    });

}

function getProfilePicture(user_id, callback, error_handler){
    var collection = database.collection('profile_pictures');
    collection.find({user_id: user_id}).toArray(function(err, docs) {
        if(err){
            error_handler(err);
        }
        else {
            if (docs.length > 0) {
                callback(docs[0].profile_picture.buffer);
            }
            else {
                // error_handler("getProfilePicture: unable to find profile_picture");
            }
        }
    });
}

function getPicture(picture_id, callback, error_handler){
    var collection = database.collection('pictures');

    collection.find({_id: toMongoIdObject(picture_id)}).toArray(function(err, docs) {
        if(err){
            error_handler(err);
        }
        else {
            if (docs.length > 0) {
                callback(docs[0].picture.buffer);
            }
            else {

            }
        }
    });
}

function getUsersActiveNotifications(user_id, callback, error_handler){
    var collection = database.collection('notifications');
    collection.find({user_id: toMongoIdObject(user_id.toString()), active: true}).toArray(function(err, docs) {
        console.log(docs);
        if(err){
            error_handler(err);
        }
        else {
            callback(docs);
        }
    });
}

function getNotification(notification_id, callback, error_handler){
    var collection = database.collection('notifications');
    collection.find({_id: toMongoIdObject(notification_id)}).toArray(function(err, docs) {
        if(err){
            error_handler(err);
        }
        else {
            console.log(docs);
            if (docs.length > 0) {
                callback(docs[0]);
            }
            else {

            }
        }
    });
}

function addNotificationToDatabase(notification, callback, error_handler){
    var collection = database.collection('notifications');
    collection.insert(notification, function (err, result) {
        if (err) {
            error_handler(err);
            return;
        } else {
            callback(notification);
        }
    });
}

function deactivateNotification(notification_id, callback, error_handler){
    var collection = database.collection('notifications');
    collection.find({_id: toMongoIdObject(notification_id), active: true}).toArray(function(err, docs) {
        if(err){
            error_handler(err);
        }
        else {
            if (docs.length > 0) {
                var notification = docs[0];
                notification.active = false;
                collection.update({_id: toMongoIdObject(notification_id)}, notification, function (err, result) {
                    if (err) {
                        error_handler(err)
                        return;
                    }
                });
            }
        }
    });
}


function updateTransactionInDatabase(transaction, callback, error_handler){
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
    var collection_listings = database.collection('listings');
    collection_listings.update({_id:new require('mongodb').ObjectID(listing._id.toString())}, listing, function (err, count, status) {
        if(err){error_handler(err.message);}
        else{
            if(callback != undefined && callback != null){callback();}
        }
    });
}

function updateUserInDatabase(user, callback, error_handler){
    var collection = database.collection('users');
    collection.update({_id:new require('mongodb').ObjectID(user._id.toString())}, {$set: user} , function(err, result) {
        if(err){error_handler(err); return;}
        if(callback != undefined){ callback(); }
    });
}

//**********************************
//**END Client->Server API methods**
//**********************************

function emitEvent(event_name, data, user_id_arr, notification_info){
    for(var i=0; i<user_id_arr.length; i++){
        getUser(user_id_arr[i], function(user){
            var notification_database_object = {message: notification_info.alert, transaction_id: data.transaction_id, user_id: user._id, sender_user_id: data.user_id, active: true, time_sent: new Date().getTime()};
            addNotificationToDatabase(notification_database_object, function(){
                var user_socket;
                if(user != undefined){
                    user_socket = io.sockets.connected[user.socket_id];
                }
                var event = new Event(event_name, data, null);
                // var event = new Event("transaction_declined", {transaction_id: transaction._id.toString()}, null);

                if(user_socket != undefined) {
                    user_socket.emit(event.name , event.message);
                }
                else{
                    if(user != undefined) {
                        // user.enqueueEvent(event);
                        if(notification_info != undefined){
                            sendNotification(notification_info, user.device_token, data.user_id, data.transaction_id);
                        }
                    }
                }
            }, function(error){
                console.log(error)
            });


        });


    }
}

function validateEmail(email_address) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email_address);
}

function validateVanderbiltEmail(email_address){
    var nameString = email_address.substring(0, email_address.indexOf("@"));
    var nameStringSplit = nameString.split(".");
    return nameStringSplit.length >= 2 && nameStringSplit.length <= 4 && /@vanderbilt.edu\s*$/.test(email_address);
}

function validateUsername(username){
    //username must be between 6-20 characters, can only contain alphanumeric and numbers
    //first character must be alphanumeric
    return /^[A-Za-z][A-Za-z0-9]{5,19}$/.test(username);
}

function validatePassword(password){
    //must be atleast 1 character long
    return password.length >= 1;
    // return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{1,}$/.test(password);
}

//user_id, title, description, location, expiration_time, price, buy

function validateTitle(title){
    // if(!(typeof title == 'string' && /^[A-Za-z0-9\s\-_,\.;:()]+$/.test(title))){
    //     return "That's an invalid title!"
    // }
    if(!(title.length <= 60)){
        return "Title must be less than 60 characters!"
    }
    else if(!( title.length > 0)){
        return "You didn't enter a title!"
    }
    return "";
}

function validateDescription(description){
    // if(!(description.length > 0 )){
    //     return "Looks like you didn't enter a description!"
    // }
    if(!(description.length <= 400)){
        return "Description must be 400 characters or less!"
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
        return "Expiration Date Is In the Past! Please enter a valid expiration date!"
    }else if(!(expiration_time <= new Date().getTime() + 86400000 * 7)){
        return "Expiration Date Is Too Far In The Future! Set a Date Within 7 Days!"
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
    // return typeof buy == 'boolean';
    return "";
}

function hashPassword(password){
    return crypto.createHmac('sha256', secret)
        .update(password)
        .digest('hex');
}

function getUUID(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

function sendNotification(notification_info, device_token, user_id, transaction_id){
    // Enter the device token from the Xcode console

    var deviceToken = device_token;

// Prepare a new notification
    var notification = new apn.Notification();
    // Specify your iOS app's Bundle ID (accessible within the project editor)
    notification.topic = 'bowen.jin.mealplanappiOS';
    // Set expiration to 1 hour from now (in case device is offline)
    notification.expiry = Math.floor(Date.now() / 1000) + 3600;
    notification_info.badge = 1;
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
        console.log(device_token);
    });

}

