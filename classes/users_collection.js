var User = require("./user2.js");
const crypto = require('crypto');
const secret = 'vandylistisawesome';

function UsersCollection(database){
    this.database = database;
    this.collection_users = database.collection('users');
}

UsersCollection.prototype = {
    constructor: UsersCollection,
    add: function(user, callback, error_handler){
        var collection_users = this.collection_users;
        if(user._id != undefined){
            user._id = toMongoIdObject(user._id);
            this.collection_users.update({_id: user._id}, {$set: user}, {upsert: true}, function (err, count, status) {
                if(err){error_handler(err.message);}
                else{
                    if(callback != undefined && callback != null){callback(user);}
                }
            });
        }
        else {
            user.password = hashPassword(user.password);
            this.collection_users.insert(user, function (err, count, status) {
                if (err) {
                    error_handler(err.message);
                }
                else {
                    collection_users.find(user).toArray(function (err, docs) {
                        if (docs.length == 1) {
                            user.update(docs[0]);
                            if (callback != undefined) {
                                callback(user);
                            }
                        }
                        else {
                            error_handler("more than 1 listing inserted into database");
                            return;
                        }
                    });
                }
            });
        }
    },
    get: function(user_ids_input, callback, error_handler){
        var user_ids = user_ids_input;
        if(!(Array.isArray(user_ids))){
            // error_handler("user_ids must be an array!")
            user_ids = [user_ids];
        }
        var user_id_arr = [];
        for(var i=0; i< user_ids.length; i++){
            user_id_arr.push(toMongoIdObject(user_ids[i]));
        }

        this.collection_users.find({_id: {$in:user_id_arr}}).toArray(function(err, docs) {
            if(docs.length > 0){
                var users_arr = [];
                for(var j=0; j< docs.length; j++){
                    var user = new User();
                    user.update(docs[j]);
                    users_arr.push(user);
                }
                if(users_arr.length == 1 && !(Array.isArray(user_ids_input))){
                    callback(users_arr[0]);
                }
                else{
                    callback(users_arr);
                }
            }
            else{
                if(user_ids.length > 1){
                    error_handler("No users were found");
                }
                else{
                    error_handler("User wasn't found");
                }

            }
        });
    },
    getForEmailAddress: function(email_address, callback, error_handler){
        this.collection_users.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var user = new User()
                user.update(docs[0]);
                callback(user);
            }
            else{
                error_handler("User with email_address " + email_address + " was not found");
            }
        });
    },
    remove: function(_id, callback){
        
    },
    size: function(){

    },

    getAll: function(callback){
        this.collection_users.find({active: true}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var active_users = [];
                for(var i=0; i<docs.length; i++){
                    var user = new User();
                    user.update(docs[i]);
                    active_users.push(user);
                }
                callback(active_users);
            }
            else{
                callback([])
            }
        });
    },
    //TODO: find some faster way to search users on socket id, maybe make another hashmap
    getUserBySocketId: function(socket_id, callback){
        this.collection_users.find({socket_id: socket_id}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var user = new User();
                user.update(docs[0]);
                callback(user);
            }
            else{
                callback([])
            }
        });
    },
    authenticate: function(user_id, password, device_token, socket_id, callback, error_handler){
        password = hashPassword(password);

        this.collection_users.findAndModify(
            {_id: toMongoIdObject(user_id), password: password, device_token: device_token, active: true},
            [],
            {$set: {socket_id: socket_id}},
            {new: true },
            function (err, docs) {
                if(!err){
                    console.log(docs);
                    if(docs.lastErrorObject.updatedExisting == true) {
                        var value = docs.value;
                        if(callback != undefined){ callback(value); }
                    }
                    else{
                        error_handler("Invalid Authentication Information");
                    }
                }
                else{
                    console.log(err);
                    error_handler("Authenticate Failed!");
                }
            }
        );
    },
    login: function(email_address, password, device_token, socket_id, callback, error_handler){
        password = hashPassword(password);

        this.collection_users.findAndModify(
            {email_address: email_address, password: password},
            [],
            {$set:
                { active: true, last_login_time: new Date().getTime(), logged_in: true, device_token: device_token, socket_id : socket_id}
            },
            {new: true},
            function (err, docs) {
                if(!err){
                    console.log(docs);
                    if(docs.lastErrorObject.updatedExisting == true) {
                        var value = docs.value;
                        if(callback != undefined){ callback(value); }
                    }
                    else{
                        console.log(err);
                        error_handler("Invalid Login Information");
                    }
                }
                else{
                    error_handler("An Error Occured while Logging in!")
                }
            }
        );
    },
    logout: function(user_id, callback, error_handler){
        this.collection_users.update({_id: toMongoIdObject(user_id)}, {$set: {logged_in: false, active: false}}, function (err, count, status) {
            if(!err){
                callback();
            }
            else{
                error_handler("logout failed");
            }
        });
    },
    //adds listing_id to buying_listing_ids of user, if called multiple times for same user_id and listing_id, will only add listing_id once.
    addBuyingListingId: function(user_id, listing_id, callback, error_handler){
        this.collection_users.update({_id: toMongoIdObject(user_id)}, {$addToSet: {buying_listing_ids: listing_id}}, function (err, count, status) {
            if(!err){
                callback();
            }
            else{
                console.log("err:" + err)
                console.log("count: " + count);
                error_handler("addBuyingListingId failed");
            }
        });
    },
    removeBuyingListingId: function(user_id, listing_id, callback, error_handler){
        this.collection_users.update({_id: toMongoIdObject(user_id)}, {pull: {buying_listing_ids: listing_id}}, function (err, count, status) {
            if(!err){
                callback();
            }
            else{
                error_handler("removeBuyingListingId failed");
            }
        });
    },
    addSellingListingId: function(user_id, listing_id, callback, error_handler){
        this.collection_users.update({_id: toMongoIdObject(user_id)}, {$addToSet: {selling_listing_ids: listing_id}}, function (err, count, status) {
            if(!err){
                callback();
            }
            else{
                error_handler("addSellingListingId failed");
            }
        });
    },
    removeSellingListingId: function(user_id, listing_id, callback, error_handler){
        this.collection_users.update({_id: toMongoIdObject(user_id)}, {pull: {selling_listing_ids: listing_id}}, function (err, count, status) {
            if(!err){
                callback();
            }
            else{
                error_handler("removeSellingListingId failed");
            }
        });
    },
    updateVenmoId: function(user_id, venmo_id, callback, error_handler) {
        this.collection_users.update({_id: toMongoIdObject(user_id)}, {$set: {venmo_id: venmo_id}}, function (err, count, status) {
            if (!err) {
                callback();
            }
            else {
                error_handler("updateVenmoId failed");
            }
        });
    },
    updateProfilePicture: function(user_id, profile_picture, callback, error_handler){
        this.collection_users.update({_id: toMongoIdObject(user_id)}, {$set: {profile_picture: profile_picture}}, function (err, count, status) {
            if (!err) {
                // console.log(count);
                callback();
            }
            else {
                error_handler("updateVenmoId failed");
            }
        });
    },

}

function toMongoIdObject(id){
    return new require('mongodb').ObjectId(id.toString());
}

function hashPassword(password){
    return crypto.createHmac('sha256', secret)
        .update(password)
        .digest('hex');
}

module.exports = UsersCollection;
