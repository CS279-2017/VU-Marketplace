function Listing(seller_user_id, isbn13, price) {
    //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
    //this._id (this will be initialized when listing retrieved from database)
    this._id = undefined;
    this.seller_user_id = seller_user_id;
    this.isbn13 = isbn13;
    this.price = price;
    this.creation_time = new Date().getTime();

    // this.title = title;
    // this.description = description;
    // this.author_names = author_names;
    // this.price = price;

    this.active = true;
    this.deactivated_time = undefined;

    this.picture_ids = [];

    this.buyer_user_ids = [];
}

Listing.prototype = {
    constructor: Listing,
    update: function (listing) {
        if(listing._id != undefined){
            this._id = listing._id.toString();
        }
        if(listing.seller_user_id != undefined){
            this.seller_user_id = listing.seller_user_id;
        }
        if(listing.isbn13 != undefined){
            this.isbn13 = listing.isbn13;
        }
        if(listing.price != undefined){
            this.price = listing.price;
        }
        if(listing.creation_time != undefined){
            this.creation_time = listing.creation_time;
        }
        if(listing.active != undefined){
            this.active = listing.active;
        }
        if(listing.deactivated_time != undefined){
            this.deactivated_time = this.deactivated_time;
        }
        if(listing.buyer_user_ids != undefined){
            this.buyer_user_ids = listing.buyer_user_ids;
        }
    },
    deactivate: function(){
        this.active = false;
        this.deactivate_time = new Date().getTime();
    },
    addBuyerId: function(buyer_id){
        if(this.buyer_user_ids == undefined){
            this.buyer_user_ids = [];
        }
        this.buyer_user_ids.push(buyer_id.toString())
    },
    addPictureId: function(picture_id){
        this.picture_ids.push(picture_id.toString());
    },
    removePictureId: function(picture_id){
        var index = this.picture_ids.indexOf(picture_id);
        if(index > -1){
            this.picture_ids.splice(index, 1);
        }
    },
}

module.exports = Listing;