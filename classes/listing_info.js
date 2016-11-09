module.exports = ListingInfo;

//ListingInfo is a subset of the parameters in Listing
//only includes those public parameters that can be viewed by other users i.e private members are not included
function ListingInfo(listing){
    this._id = listing._id;
    this.user_id = listing.user_id;
    this.title = listing.title;
    this.description = listing.description;
    this.location = listing.location;
    this.creation_time = listing.creation_time;
    this.expiration_time = listing.expiration_time;
    this.price = listing.price;
    this.buy = listing.buy;
    this.transaction_id = listing.transaction_id;
    this.is_active = null;
}
