
var Listing = require("./listing2.js");

function ListingsCollection(database){
    this.database = database;
    this.collection_listings = database.collection('listings');
}

//always create transaction before deleting listing
ListingsCollection.prototype = {
    constructor: ListingsCollection,
    add: function(listing, callback, error_handler) {
        var collection_listings = this.collection_listings;
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
                            if(callback != undefined){ callback(listing);}
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
        this.collection_listings.find({user_id: toMongoIdObject(user_id.toString())}).toArray(function(err, docs) {
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

}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = ListingsCollection;

