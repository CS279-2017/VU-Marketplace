
var Listing = require("./listing2.js");

var UsersCollection = require("./users_collection.js");

function ListingsCollection(database){
    this.database = database;
    this.collection_listings = database.collection('listings');
    this.users_collection = new UsersCollection(database);
}

//always create transaction before deleting listing
ListingsCollection.prototype = {
    constructor: ListingsCollection,
    add: function(listing, callback, error_handler) {
        var collection_listings = this.collection_listings;
        var users_collection = this.users_collection;
        if(listing._id != undefined){
            listing._id = toMongoIdObject(listing._id);
            this.collection_listings.update({_id: listing._id}, {$set: listing}, {upsert: true}, function (err, count, status) {
                if(err){error_handler(err.message);}
                else{

                    if(callback != undefined && callback != null){callback(listing);}
                }
            }); 
        }
        else{
            this.collection_listings.insert(listing, function (err, count, status) {
                if(err){error_handler(err.message);}
                else{
                    //this cannot be used to reference collection listings inside closure thus we must assign and use a local variable
                    collection_listings.find(listing).toArray(function(err, docs){
                        if(docs.length == 1){
                            listing.update(docs[0]);
                            users_collection.addSellingListingId(listing.user_id, listing._id.toString(), function(){
                                if(callback != undefined){ callback(listing);}
                            }, error_handler)
                        }
                        else{
                            error_handler("more than 1 listing inserted into database");
                            return;
                        }
                    });
                }
            });
        }
    },

    buy: function(listing_id, buyer_user_id, callback, error_handler){
        var collection_listings = this.collection_listings;
        listing_id = toMongoIdObject(listing_id);
        this.collection_listings.update({_id: listing_id, $or:[{bought_by_user_id: {$exists: false}}, {bought_by_user_id: null}]}, {$set: {bought_by_user_id: buyer_user_id}}, function (err, count, status) {
            if(count == 0){error_handler("listing was already bought!");}
            else{
                if(callback != undefined && callback != null){callback();}
            }
        });
    },
    //remove listing from
    remove: function(listing_id){

    },
    get: function(listing_ids, callback, error_handler){
        if(!(Array.isArray(listing_ids))){
            error_handler("listing_ids must be an array!")
        }
        var listing_id_arr = [];
        for(var i=0; i< listing_ids.length; i++){
            listing_id_arr.push(toMongoIdObject(listing_ids[i].toString()));
        }
        this.collection_listings.find({_id: {$in:listing_id_arr}}).toArray(function(err, docs) {
            if(docs.length > 0){
                var listings_arr = [];
                for(var j=0; j< docs.length; j++){
                    var listing = new Listing();
                    listing.update(docs[j]);
                    listings_arr.push(listing);
                }
                if(listings_arr.length == 1){
                    callback(listings_arr[0]);
                }
                else{
                    callback(listings_arr);
                }
            }
            else{
                error_handler("No users were found");
            }
        });
    },
    //returns an array of all the listings
    getAll: function(callback){
        // return this.listings;
        this.collection_listings.find({active: true}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var active_listings = [];
                for(var i = 0; i < docs.length; i++){
                    var listing = new Listing();
                    listing.update(docs[i]);
                    active_listings.push(listing);
                }
                callback(active_listings);
            }
            else {
                callback([]);
            }
        });
    },
    getAllForUser: function(user_id, callback){
        this.collection_listings.find({user_id: user_id}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var active_listings = [];
                for(var i = 0; i < docs.length; i++){
                    var listing = new Listing();
                    listing.update(docs[i]);
                    active_listings.push(listing);
                }
                callback(active_listings);
            }
            else {
                callback([]);
            }
        });
    },
    getListingsWithBookIsbn: function(isbn13, callback){
        this.collection_listings.find({isbn13: isbn13}).toArray(function(err, docs) {
            var active_listings = [];
            if(docs.length > 0) {
                for(var i = 0; i < docs.length; i++){
                    var listing = new Listing();
                    listing.update(docs[i]);
                    active_listings.push(listing);
                }
                callback(active_listings);
            }
            else {
                callback([]);
            }
        });
    },
    getListingsWithUserId: function(user_id, callback){
        this.collection_listings.find({$or: [{user_id: user_id.toString()}, {buyer_user_ids: {$elemMatch: {user_id: user_id.toString()}}}]}).toArray(function(err, docs) {
            var active_listings = [];
            if(!err){
                if(docs.length > 0) {
                    for(var i = 0; i < docs.length; i++){
                        var listing = new Listing();
                        listing.update(docs[i]);
                        active_listings.push(listing);
                    }
                    callback(active_listings);
                }
                else {
                    callback([]);
                }
            }
            else{
                console.log(err);
            }
        });
    },
    deactivate: function(listing_id, callback, error_handler){
        this.collection_listings.update({_id: toMongoIdObject(listing_id), active: true}, {$set: {active: false, deactivate_time: new Date().getTime()}}, function (err, count, status) {
            if(!err && count == 1){
                callback();
            }
            else{
                error_handler("deactivate failed");
            }
        });
    },
    activate: function(listing_id, callback, error_handler){
        this.collection_listings.update({_id: toMongoIdObject(listing_id), active: false}, {$set: {active: true}}, function (err, count, status) {
            if(!err && count == 1){
                callback();
            }
            else{
                error_handler("activate failed");
            }
        });
    },
    addBuyerId: function(listing_id, buyer_id, callback, error_handler){
        //adds buyer_id to buyer_ids of listing if it doesn't already exist and if buyer is the seller, also only if listing is active
        this.collection_listings.update({$and: [{_id: toMongoIdObject(listing_id), active: true}, {$not: {user_id: buyer_id}}]}, {$addToSet: {buyer_user_ids: buyer_id}}, function (err, count, status) {
            if(!err && count == 1){
                callback();
            }
            else{
                error_handler("addBuyerId failed");
            }
        });
    },
    addPictureId: function(listing_id, picture_id, callback, error_handler){
        this.collection_listings.update({_id: toMongoIdObject(listing_id)}, {addToSet: {picture_ids: picture_id}}, function (err, count, status) {
            if(!err && count == 1){
                callback();
            }
            else{
                error_handler("addPictureId failed");
            }
        });
    },
    removePictureId: function(listing_id, picture_id, callback, error_handler){
        this.collection_listings.update({_id: toMongoIdObject(listing_id)}, {$pull: {picture_ids: picture_id}}, function (err, count, status) {
            if(!err && count == 1){
                callback();
            }
            else{
                error_handler("addPictureId failed");
            }
        });
    },

}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = ListingsCollection;

