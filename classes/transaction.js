module.exports = Transaction;

//Transactions Database Schema:
//{_id, title, description, user_id_buy, user_id_sell, listing_id, conversation, user_buy_will_initiate, ...
//...user_sell_will_initiate, user_buy_confirm_met_up, user_sell_confirm_met_up}
//TODO:
//transaction is saved to database when it has been terminated
//note create the transaction before deleting a listing
//note if we had to recreate transaction object from database, we would need a parameter for conversation as well
function Transaction(user_id_buy, user_id_sell, listing_id){
    //this._id (this is assigned when transaction retrieved from database)
    //TODO: should user references be references or ids? ids are easier to save on database
    //TODO: transaction is automatically converted to JSON by JSON.stringify
    //TODO: we store id's rather than references since saving a reference to a database is storing redundant info
    //TODO: we can easily look up any id in the 'active' data structure or if not present then in the database
    //if the above two are null or if listing is null/undefined then transaction fails, ie every transaction must be created
    //from an active listing
    if(listing == null || listing == undefined){
        throw "transaction cannot be created from a listing that is "+listing;
    }
    this.title = listing.title; //copy over from listing (since listing will be deleted from active_listings
    this.description = listing.description; //copy over from listing (since listing will be deleted from active_listings
    this.user_id_buy = user_id_buy; //_id of User
    this.user_id_sell = user_id_sell; //_id of Seller
    this.listing_id = listing_id; //listing_id
    this.conversation = new Conversation();
    this.user_buy_will_initiate = null; //whether buyer agrees to begin transaction, true = yes, false = no, null = not responded yet
    this.user_sell_will_initiate = null; //whether seller agrees to begin transaction, true = yes, false = no, null = not responded yet
    this.user_buy_confirm_met_up = null; //whether buyer confirms that transaction has been completed, null = not accepted, true = accepted, false = declined
    this.user_sell_confirm_met_up = null; //whether buyer confirms that transaction has been completed, null = not accepted, true = accepted, false = declined
    //in both initiate and confirm_meet_up any false indicates the transaction was canceled by one party
}

Transaction.prototype = {
    constructor: Transaction,
    initFromDatabase: function(){
        
    },
    sendMessage: function(text, username){
        //sends a message to the current conversation
        //current_transaction cannot be null
        if(this.conversation == null){
            throw "tried to send message to null Conversation";
        }
        //(Message(text, username, time_sent)
        var message = new Message(text, username, new Date());
        this.conversation.send_message(message);
    },
    //TODO: the below modifications should be done atomically so as the avoid race conditions
    //initiates for the user with user_id (checks both user_id_buyer and user_id_seller to find which initiate to change)
    inititate: function(user_id){
        //TODO: check whether user_id is of buyer or of seller, then set the appropriate will_initiate value

    },
    dontInititate: function(user_id){
        //TODO: check whether user_id is of buyer or of seller, then set the appropriate will_initiate value
    },
    
    confirm: function(user_id){
        //TODO: throw error if user_id doesn't match one of the two user_ids of the transactions
        //TODO: set the confirm to true for the appropriate

    },
    reject: function(user_id){
        //TODO: throw error if user_id doesn't match one of the two user_ids of the transactions
        //TODO: set the confirm to false for the appropriate_user
    },
    //returns whether transaction has been initiated
    hasInitated: function(){
        //TODO: if both initiated boolean values are true then has started
    },
    hasCompleted: function(){
        //TODO: if both confirm_met_up are true then return true;
    },
}