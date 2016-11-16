module.exports = ActiveListings;

function ActiveListings(){
    //maintain a listings array so that listings are listed in some sequence
    this.listings = [];
    //maintain a map so that listings can be retrieved in constant time by _id
    this.map = {};
}

//always create transaction before deleting listing
ActiveListings.prototype = {
    constructor: ActiveListings,
    //add listing to both the array and the map (map is indexed by _id of listing)
    add: function(listing) {
        this.listings.push(listing);
        this.map[listing._id] = listing;
    },
    //remove listing from
    remove: function(listing_id){
        //get listing from listings using index and delete that value from map, must be done first otherwise we
        //won't be able to access the listing using an index into the listings array
        var listing = this.map[listing_id];
        delete this.map[listing_id];
        //then delete listing from listings at the index
        var index = this.listings.indexOf(listing)
        this.listings.splice(index, 1);
    },
    get: function(listing_id){
        return this.map[listing_id];
    },
    //returns an array of all the listings
    getAll: function(){
        return this.listings;
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