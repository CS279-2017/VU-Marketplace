module.exports = Listing;

function Listing(id, user, title, description, location, creation_time, expiration_time, price, buy){
    //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
    if(arguments.length == 8) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.description = description;
        this.location = location;
        this.creation_time = creation_time;
        this.expiration_time = expiration_time;
        this.price = price;
        this.buy = buy;
        this.transaction_id = null;
    }
    //Listing()
    else if(arguments.length == 0){
        //create an empty listing
    }
    //Listing(id)
    else if(arguments.length == 1){
        //get argument from database, get listing with the id
    }


}

Listing.prototype = {
    constructor: Listing,
}