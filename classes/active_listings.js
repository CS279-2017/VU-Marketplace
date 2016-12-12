module.exports = ActiveListings;

var Listing = require("./listing.js");

function ActiveListings(){
    //maintain a listings array so that listings are listed in some sequence
    this.listings = [];
    //maintain a map so that listings can be retrieved in constant time by _id
    this.map = {};

    this.hash_tag_map = {};
}

//always create transaction before deleting listing
ActiveListings.prototype = {
    constructor: ActiveListings,
    initFromDatabase: function(active_listings){
        for(var i=0; i<active_listings.length; i++){
            var listing = active_listings[i]
            var new_listing = new Listing();
            console.log(listing);
            new_listing.initFromDatabase(listing);
            this.listings.push(new_listing);
            this.map[new_listing._id] = new_listing; 
        }
    },
    //add listing to both the array and the map (map is indexed by _id of listing)
    add: function(listing) {
        this.listings.push(listing);
        this.map[listing._id] = listing;
        var hash_tags = listing.description.match(/(^|\s)(#[a-z\d-]+)/);
        if(hash_tags != null && hash_tag != undefined){
            for(var i = 0; i < hash_tags.length; i++){
                var hash_tag = hash_tags[i];

                if(this.hash_tag_map[hash_tag]  == undefined){
                    this.hash_tag_map[hash_tag] = [];
                }
                this.hash_tag_map[hash_tag].push(listing);
            }
        }

    },
    //remove listing from
    remove: function(listing_id){
        //get listing from listings using index and delete that value from map, must be done first otherwise we
        //won't be able to access the listing using an index into the listings array
        var listing = this.map[listing_id];
        delete this.map[listing_id];
        //then delete listing from listings at the index
        var index = this.listings.indexOf(listing)
        // if(index != -1){
            this.listings.splice(index, 1);
        // }

        var hash_tags = listing.description.match(/(^|\s)(#[a-z\d-]+)/);
        if(hash_tags != null && hash_tag != undefined){
            for(var i = 0; i < hash_tags.length; i++){
                var hash_tag = hash_tags[i];

                if(this.hash_tag_map[hash_tag] != undefined){
                    var index = this.hash_tag_map[hash_tag].indexOf(listing);
                    // if(index != -1){
                    this.hash_tag_map[hash_tag].splice(index, 1);
                    // }
                }
            }
        }

    },
    get: function(listing_id){
        return this.map[listing_id];
    },
    //returns an array of all the listings
    getAll: function(){
        return this.listings;
    },
    getAllForUser: function(){
        var listings_arr = [];
        for(var i=0; i <this.listings.length(); i++){
            var listing = this.listings[i];
            if(user_id == listing.user_id ){
                listings_arr.push(listing);
            }
        }
        // console.log("active_listings,getAllForUser:");
        // console.log(transactions_arr)
        return listings_arr;
    },
    getListingsWithHashTag: function(hash_tag){
        var listings = this.hash_tag_map[hash_tag];
        if(listings = undefined){
            return [];
        }
        return listings;
    },
    size: function(){
        return this.listings.length;
    },
    //clears the active_listings, for testing purposes
    clear: function(){
        this.listings = [];
        this.map = {};
    },


    //TODO: this expired method is called every so many seconds, find a more efficient way
    getExpiredListings:function(){
        var expired_listings_arr = [];
        for(var key in this.listings){
            var listing = this.listings[key]
            if(listing.isExpired()){
                expired_listings_arr.push(listing);
            }
        }
        return expired_listings_arr;
    },

}