var http = require('http');
var bodyParser = require('body-parser');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);


const crypto = require('crypto');
const secret = 'vandylistisawesome';

var request = require("request");

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = require('mongodb').MongoClient;
// Connection URL. This is where your mongodb server is running.
// var url = 'mongodb://localhost:27017/mealplanappserver';
var url = 'mongodb://heroku_g6cq993c:f5mm0i1mjj4tqtlf8n5m22e9om@ds129018.mlab.com:29018/heroku_g6cq993c'
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
var NotificationsCollection = require("./classes/notifications_collection")

var ConversationsCollection = require("./classes/conversations_collection")
var RegistrationInformationCollection = require("./classes/registration_information_collection");


// create reusable transporter object using the default SMTP transport
// var transporter = nodemailer.createTransport({
//     service: 'SendGrid',
//     auth: {
//         // user: 'mealplanapp@gmail.com', // Your email id
//         // pass: 'chocho513' // Your password
//         user: 'mealplanapp',
//         pass: 'chocho513'
//     }
// });

// Set up apn with the APNs Auth Key

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
var conversation_collection;
var registration_information_collection;
var notifications_collection;

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
        conversation_collection = new ConversationsCollection(db);
        registration_information_collection = new RegistrationInformationCollection(db);
        notifications_collection = new NotificationsCollection(db);
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
        if(validateEmail(email_address) == false){
            //return a object type that has an error message
            error_handler("invalid email address");
            console.log("validateEmail is false");
            return;
        }
        //validate email address is vanderbilt.edu
        if(validateVanderbiltEmail(email_address) == false){
            error_handler("Must be a valid vanderbilt.edu email address")
            console.log("validateVanderbiltEmail is false");
            return;
        }
        registration_information_collection.registerEmail(email_address, callback, error_handler)

    });

    socket.on('register_verification_code', function(json){
        var verification_code = json.verification_code;
        var password = json.password;
        var email_address = json.email_address.toLowerCase();
        var callback = function(){
            var user = new User(email_address, password);
            users_collection.add(user, function(user){
                socket.emit("register_verification_code_response", {data: null, error: null});
            }, error_handler)
        };
        var error_handler = function(e) {
            socket.emit("register_verification_code_response", {data: null, error: e});
            console.log(e);
        }
        registration_information_collection.registerVerificationCode(verification_code, email_address, password, callback, error_handler)
    });

    socket.on('reset_password_email_address', function(json) {
        var email_address = json.email_address.toLowerCase();
        var callback = function () {
            socket.emit('reset_password_email_address_response', {data: null , error: null});
        };
        var error_handler = function (e) {
            socket.emit('reset_password_email_address_response', {data: null , error: e})
            console.log(e);
            return;
        }
        registration_information_collection.resetPasswordEmail(email_address, callback, error_handler)
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
        registration_information_collection.resetPasswordVerificationCode(verification_code, email_address, password, callback, error_handler)
    });

    socket.on('login', function(json){
        var email_address = json.email_address.toLowerCase();
        var password = json.password;
        var device_token = json.device_token;
        
        var socket_id = socket.id

        console.log('login received!')
        //TODO: should we allow logging in from multiple devices at once? for now yes
        users_collection.login(email_address, password, device_token, socket_id, function(user){
            socket.emit("login_response", {data: {user: user}, error: null});
        }, function(error){
            socket.emit("login_response", {data: null, error: error});
            console.log(error);
        })
    });

    socket.on('logout', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var socket_id = socket.id

        console.log('logout called');
        function callback(){
            socket.emit("logout_response", {data: null, error: null});
        }
        function error_handler(e){
            socket.emit("logout_response", {data: null, error: e});
            console.log(e);
        }

        authenticate(user_id, password, device_token, socket_id, function(user){
            console.log("authentication successful!")
            users_collection.logout(user._id, function(){
                console.log('logout successful!')
                console.log(user.first_name + " " + user.last_name + " has logged out");
                if(callback != undefined){ callback(); }
            }, error_handler)
        }, error_handler);
    });

    socket.on('authenticate', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token;
        var socket_id = socket.id

        function callback(user){
            socket.emit('authenticate_response', {data: null, error: null});
            console.log("authenticated " + user.first_name + " " + user.last_name)
        }
        function error_handler(e){
            socket.emit('authenticate_response', {data: null, error:e});
            console.log(e);
        }
        users_collection.authenticate(user_id, password, device_token, socket_id, callback, error_handler)
    });

    socket.on('make_listing', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var socket_id = socket.id

        var book = json.book;
        var description = json.description;
        var price = json.price;

        // var location = json.location;
        // var expiration_time = json.expiration_time;
        // var title = json.title;
        // var isbn13 = json.isbn13
        // var author_names = json.author_names;
        // var buy = false;
        
        authenticate(user_id, password, device_token, socket_id, function(user){
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
                    users_collection.addSellingListingId(user_id, listing._id.toString(), function(){
                        callback(listing);
                    }, error_handler)
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

        var socket_id = socket.id

        var listing_id = json.listing_id
        var title = json.title;
        var description = json.description;
        var location = json.location;
        var expiration_time = json.expiration_time;
        var price = json.price;
        var buy = json.buy;

        authenticate(user_id, password, device_token, socket_id, function(user){
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

        var socket_id = socket.id

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
        authenticate(user_id, password, device_token, socket_id, function(user){
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

    socket.on('get_listing', function(json){
        var listing_id = json.listing_id;
        function callback(listing){
            //send all_listings_collection back to client
            socket.emit("get_listing_response", {data: {listing: listing}, error: null});
        }
        function error_handler(e){
            socket.emit("get_listing_response", {data: null, error: e});
            console.log(e);
        }
        listings_collection.get(listing_id, function(listing){
            callback(listing);
        }, error_handler);
    });

    socket.on('get_listings', function(json){
        var listing_ids = json.listing_ids;
        function callback(listings){
            //send all_listings_collection back to client
            socket.emit("get_listings_response", {data: {listings: listings}, error: null});
        }
        function error_handler(e){
            socket.emit("get_listings_response", {data: null, error: e});
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
            // console.log("calling listings_collections.getListingsWithUserId");
            listings_collection.getListingsWithUserId(user_id, function(listings){
                console.log(listings);
                callback(listings);
            });
        }catch(e){
            error_handler(e.message);
            return;
        }
    });

    socket.on('get_listings_most_recent', function(json){
        var number = json.number;
        function callback(listings){
            socket.emit("get_listings_most_recent_response", {data: {listings: listings}, error: null})
        }
        function error_handler(e){
            socket.emit("get_listings_most_recent_response", {data: null, error: e})
        }
        try {
            // console.log("calling listings_collections.getListingsWithUserId");
            listings_collection.getMostRecent(number, function(listings){
                console.log(listings);
                callback(listings);
            });
        }catch(e){
            error_handler(e.message);
            return;
        }
    })

    socket.on('get_conversation', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token;

        var socket_id = socket.id

        var other_user_id = json.other_user_id;


        function callback(conversation){
            socket.emit("get_conversation_response", {data: {conversation: conversation}, error: null})
        }
        function error_handler(e){
            socket.emit("get_conversation_response", {data: null, error: e})
        }
        try {
            authenticate(user_id, password, device_token, socket_id, function(user){
                conversation_collection.getForPairUserIds(user._id.toString(), other_user_id, function(conversation){
                    //change to return conversation object?
                    callback(conversation);
                }, error_handler)
            }, error_handler)

        }catch(e){
            error_handler(e.message);
            return;
        }
    })

    socket.on('get_conversations_with_listing_id', function(json){
        console.log('get_conversations_with_listing_id was called!')
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token;

        var socket_id = socket.id

        var listing_id = json.listing_id;

        function callback(conversations){
            socket.emit("get_conversations_with_listing_id_response", {data: {conversations: conversations}, error: null})
        }
        function error_handler(e){
            socket.emit("get_conversations_with_listing_id_response", {data: null, error: e})
        }

        try {
            authenticate(user_id, password, device_token, socket_id, function(user){
                listings_collection.get(listing_id, function(listing){
                    conversation_collection.getOneToMany(user._id.toString(), listing.buyer_user_ids, function(conversations){
                        //change to return conversation object?
                        callback(conversations);
                    }, error_handler)
                }, error_handler)
            }, error_handler)

        }catch(e){
            error_handler(e.message);
            return;
        }
        
    })
    
    socket.on('update_user_location', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var socket_id = socket.id

        var new_location = json.new_location;

        authenticate(user_id, password, device_token, socket_id, function(user){
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

        var socket_id = socket.id

        var venmo_id = json.venmo_id;
        function callback(updated_venmo_id){
            socket.emit("update_venmo_id_response", {data: {updated_venmo_id: updated_venmo_id}, error: null});
        }
        function error_handler(e){
            socket.emit("update_venmo_id_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, device_token, socket_id, function(user){
            users_collection.updateVenmoId(user_id, venmo_id, function(){
                callback(venmo_id);
            }, error_handler)
        })
    });

    socket.on('update_profile_picture', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var socket_id = socket.id

        var profile_picture = json.profile_picture;


        authenticate(user_id, password, device_token, socket_id, function(user){
            users_collection.updateProfilePicture(user_id, profile_picture, callback, error_handler)
            // updateProfilePicture(user_id, profile_picture, callback, error_handler)
        }, error_handler)

        function callback(){
            socket.emit("update_profile_picture_response", {data: null, error: null});
            console.log("update_profile_picture successful!")
            // io.emit("profile_picture_updated", {data: {user_id: user_id}, error: null});
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

        var socket_id = socket.id

        var picture_id = json.picture_id;
        var picture = json.picture;

        getUserInfo(user_id, function(user_info){
            console.log(user_info.first_name + " " + user_info.last_name + " called update_picture")
        }, function(){})
        authenticate(user_id, password, device_token, socket_id, function(user){
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

        var socket_id = socket.id

        var listing_id = json.listing_id
        var picture = json.picture;
        authenticate(user_id, password, device_token, socket_id, function(user){
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

        var socket_id = socket.id

        var listing_id = json.listing_id
        var picture_id = json.picture_id;
        authenticate(user_id, password, device_token, socket_id, function(user){
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

        var socket_id = socket.id


        var to_user_id = json.to_user_id;
        var message_text = json.message_text;
        //listing that the message is inquiring about can be undefined/null
        var listing_id = json.listing_id

        function callback(message){
            socket.emit("send_message_response", {data: {message: message}, error: null});
        }
        function error_handler(e){
            socket.emit("send_message_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, device_token, socket_id, function(user){
            var message = new Message(message_text, user_id, to_user_id);
            //add message to database and send out notification
            messages_collection.add(message, function(message){
                conversation_collection.addMessage(message, function(){
                    //sends notification to user receiving the message
                    var alert = user.first_name + " " + user.last_name + ": " + message_text;
                    var notification_info = {alert: alert, category: "MESSAGE_SENT", payload: {from_user_id: user_id, to_user_id: to_user_id, listing_id: listing_id}};
                    emitEvent("message_sent", message, [to_user_id], notification_info);

                    //add user_id to buyer_ids of the listing
                    console.log(listing_id);
                    if(listing_id != undefined && listing_id != null){
                        //adds to a set, thus can call multiple times without adding repeats
                        listings_collection.addBuyerId(listing_id, user_id, function(){
                            callback(message);
                        }, error_handler)
                    }
                    else{
                        //if listing_id isn't passed with message, it isn't attached to a listing,
                        //however it is still added to message_collection and to a conversation
                        callback(message);
                    }
                }, error_handler);
            }, error_handler)
        }, error_handler)
    });

    socket.on('get_notifications', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var socket_id = socket.id

        function callback(notifications){
            //send all_listings_collection back to client

            socket.emit("get_notifications_response", {data: {notifications: notifications}, error: null});
        }
        function error_handler(e){
            socket.emit("get_notifications_response", {data: null, error: e});
            console.log(e);
        }
        authenticate(user_id, password, device_token, socket_id, function(user){
            notifications_collection.getForUserId(user_id, callback, error_handler);
        }, error_handler);
    });

    socket.on('deactivate_notification', function(json){
        var user_id = json.user_id;
        var password = json.password;
        var device_token = json.device_token

        var socket_id = socket.id

        var notification_id = json.notification_id


        function callback(){
            //send all_listings_collection back to client
            socket.emit("deactivate_notification_response", {data: null, error: null});
        }
        function error_handler(e){
            socket.emit("deactivate_notification_response", {data: null, error: e});
            console.log(e);
        }
        notifications_collection.deactivate(notification_id, callback, error_handler)
    });



    socket.on('get_users', function(json){
        var user_ids = json.user_ids;
        function callback(users){
            //send all_listings_collection back to client
            socket.emit("get_users_response", {data: {users: users}, error: null});
        }
        function error_handler(e){
            socket.emit("get_users_response", {data: null, error: e});
            console.log(e);
        }
        users_collection.get(user_ids, function(users){
            callback(users);
        }, error_handler);
    });

    socket.on('get_user', function(json){
        var user_id = json.user_id;
        function callback(user){
            //send all_listings_collection back to client
            socket.emit("get_user_response", {data: {user: user}, error: null});
        }
        function error_handler(e){
            socket.emit("get_user_response", {data: null, error: e});
            console.log(e);
        }
        users_collection.get(user_id, function(users){
            callback(users);
        }, error_handler);
    })


    socket.on('search_books', function(json){
        console.log("search_books called!")
        var search_query = json.search_query;
        var google_api_key = "AIzaSyDbFhHzgxWBrYnIU0EvS5m4wjp-DuCC7ms";
        var api_key = "4MCC8UA5"
        var google_request_url = "https://www.googleapis.com/books/v1/volumes?q=" + search_query + "&key=" + google_api_key
        var request_url = "http://isbndb.com/api/v2/json/" + api_key + "/books?q=" + search_query;
        // console.log(request_url);
        // request(request_url, function (error, response, body) {
        //     if (!error && response.statusCode == 200) {
        //         var books = [];
        //         var json = JSON.parse(body)
        //         var data = json.data;
        //         // console.log(data.length);
        //         if(data != undefined){
        //             for(var i=0; i<data.length; i++){
        //                 var book = new Book();
        //                 book.initWithIsbnDb(data[i])
        //                 books.push(book);
        //             }
        //         }
        //         console.log("search_books_response success!")
        //         socket.emit("search_books_response", {data: {books: books}, error: null});
        //     }
        //     else{
        //         console.log("search_books_response failure!")
        //         socket.emit("search_books_response", {data: null, error: "Search Query Failed"});
        //     }
        // });

        request(google_request_url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var books = [];
                var json = JSON.parse(body)
                var totalItems = json.totalItems;
                var items = json.items;
                if(items != undefined){
                    for(var i=0; i<items.length; i++){
                        var book = new Book();
                        book.initWithGoogleBooks(items[i]);
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


function authenticate(user_id, password, device_token, socket_id, callback, error_handler){
    users_collection.authenticate(user_id, password, device_token, socket_id, callback, error_handler);
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

//1. authenticate
//2. get listings_collection
//3. return listings_collection



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
            var new_user = new User();
            new_user.update(user)
            new_user.logged_in = true;
            callback(new_user)
        }
    });

}

function getUser(user_id, callback, error_handler){
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
        users_collection.get(user_id_arr[i], function(user){
            // var notification_database_object = {message: notification_info.alert, transaction_id: data.transaction_id, user_id: user._id, sender_user_id: data.user_id, active: true, time_sent: new Date().getTime()};
            var notification = new Notification(user._id.toString(), notification_info.alert, notification_info);
            notifications_collection.add(notification, function(notification){
                var user_socket;
                if(user != undefined) {
                    user_socket = io.sockets.connected[user.socket_id];
                }
                if(user_socket != undefined) {
                    user_socket.emit(event_name , data);
                }
                else{
                    if(user != undefined){
                        notification.send(user.device_token, function(){

                        }, function(error){

                        });
                    }
                }
            }, function(error){
                console.log("emitEvent error occured: " + error);
            })
        }, function(error){
            console.log(error);
        })
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

function getUUID(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

function hashPassword(password){
    return crypto.createHmac('sha256', secret)
        .update(password)
        .digest('hex');
}

