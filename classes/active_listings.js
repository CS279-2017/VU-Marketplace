module.exports = ActiveListings;

function ActiveListings(){
    this.listings = []
}

//always create transaction before deleting listing
ActiveListings.prototype = {
    constructor: ActiveListings,
    add: function(listing) {
        this.listings.add(listing);
    },
    delete: function(index){
        //add transaction to Transactions table in db
        this.listings.splice(index, 1);

    }
}