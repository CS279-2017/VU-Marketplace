var Conversation = require("./conversation.js");
var Message = require("./message.js")

//Transactions Database Schema:
//{_id, title, description, buyer_user_id, seller_user_id, listing_id, conversation, user_buy_will_initiate, ...
//...user_sell_will_initiate, buyer_confirmed_meet_up, seller_confirmed_meet_up}
//TODO:
//transaction is saved to database when it has been terminated
//note create the transaction before deleting a listing
//note if we had to recreate transaction object from database, we would need a parameter for conversation as well
//should users be able to offer their own lower price?

//TODO: can there be multiple transactions at the same time between the same two users?
var Transaction = function() {
    //pass in listing from which the transaction is made
    function Transaction(user_buy_id, user_sell_id, listing) {
        //this._id (this is assigned when transaction retrieved from database)
        //TODO: should user references be references or ids? ids are easier to save on database
        //TODO: transaction is automatically converted to JSON by JSON.stringify
        //TODO: we store id's rather than references since saving a reference to a database is storing redundant info
        //TODO: we can easily look up any id in the 'active' data structure or if not present then in the database
        //if the above two are null or if listing is null/undefined then transaction fails, ie every transaction must be created
        //from an active listing
        // if (listing == null || listing == undefined) {
        //     throw {message: "transaction cannot be created from a listing that is " + listing};
        // }
        if (user_buy_id != undefined && user_sell_id != undefined) {

            if (user_buy_id.toString() == user_sell_id.toString()) {
                console.log(user_buy_id);
                console.log(user_sell_id);
                throw {message: "user with id " + user_buy_id + " tried to create a transaction with himself"};
            }
        }
        if(listing != undefined) {
            this.title = listing.title; //copy over from listing (since listing will be deleted from active_listings
            this.description = listing.description; //copy over from listing (since listing will be deleted from active_listings
            this.location = listing.location;
            this.creation_time = new Date().getTime()
            this.price = listing.price
            this.buyer_user_id = user_buy_id; //_id of User
            this.seller_user_id = user_sell_id; //_id of Seller
            this.buy = listing.buy;
            this.listing_id = listing._id; //listing_id
            this.conversation = new Conversation();
            if (listing.buy == true) {
                this.buyer_accepted_request = null;
                this.seller_accepted_request = true;
            }
            else {
                this.buyer_accepted_request = true;
                this.seller_accepted_request = null;
            } //booling containing with user_buy and user_sell have accepted the request, user that creates the transaction will
            // set the bool to yes automatically
            this.buyer_confirmed_meet_up = null; //whether buyer confirms that transaction has been completed, null = not accepted, true = accepted, false = declined
            this.seller_confirmed_meet_up = null; //whether buyer confirms that transaction has been completed, null = not accepted, true = accepted, false = declined
            //in both initiate and confirm_meet_up any false indicates the transaction was canceled by one party
            this.end_time = null;
            this.start_time = null;

            this.active = true;
        }
    }

    function verifyTransactionNotActivatedThenSetAcceptRequest(user_id, value) {
        console.log("verifyTransactionNotActivated");
        console.log("this: ");
        console.log(this);
        if (this.buyer_accepted_request == null && this.seller_accepted_request != null) {
            if (this.buyer_user_id.toString() == user_id.toString()) {
                this.buyer_accepted_request = value;
            }
            else {
                console.log(this.buyer_user_id);
                console.log(typeof this.buyer_user_id.toString());
                console.log(user_id.toString());
                console.log(typeof user_id);
                // console.log(this.buyer_user_id === user_id);
                throw {message: "the user_id " + this.buyer_user_id + " associated with this transaction doesn't match the user id of the" +
                " user that is accepting the transaction " + user_id}
            }
        }

        else if (this.buyer_accepted_request != null && this.seller_accepted_request == null) {
            if (this.seller_user_id.toString() == user_id.toString()) {
                this.seller_accepted_request = value;
            }
            else {
                throw {message: "the user_id " + this.seller_user_id + " associated with this transaction doesn't match the user id of the" +
                " user that is accepting the transaction which is" + user_id}
            }
        }
        else {
            throw {message: "transaction with id " + this._id + "has already been accepted or declined"}
            return;
        }
    }

    function verifyTransactionActiveThenSetConfirmed(user_id, value){
        if(this.isActive()){
            console.log("user_id: " + user_id);
            console.log("seller_id " + this.seller_user_id);
            console.log("buyer_id" + this.buyer_user_id);
            if(this.buyer_user_id.toString() == user_id.toString()){
                this.buyer_confirmed_meet_up = value;
            }
            else if(this.seller_user_id.toString() == user_id.toString()){
                this.seller_confirmed_meet_up = value;
            }
            else{
                throw {message:"the user id " + user_id + " that is attempting to confirm the transaction with id " + this._id +
                "doesn't match buyer id or seller id"};
            }
        }
        else{
            throw {message: "tried to confirm transaction with id " + this._id + " but transaction is not active"};
        }
    }

    //TODO: what if there are multiple transaction requests on the same listing?
    Transaction.prototype = {
        constructor: Transaction,
        initFromDatabase: function (transaction) {
            this._id = transaction._id
            this.title = transaction.title;
            this.description = transaction.description;
            this.location = transaction.location;
            this.creation_time = transaction.creation_time;
            this.price = transaction.price
            this.buyer_user_id = transaction.buyer_user_id;
            this.seller_user_id = transaction.seller_user_id; //_id of Seller
            this.buy = transaction.buy
            this.listing_id = transaction.listing_id; //listing_id
            this.conversation = new Conversation(transaction.conversation);
            this.buyer_accepted_request = transaction.buyer_accepted_request;
            this.seller_accepted_request = transaction.seller_accepted_request;
            this.buyer_confirmed_meet_up = transaction.buyer_confirmed_meet_up;
            this.seller_confirmed_meet_up = transaction.seller_confirmed_meet_up;
            
            if(transaction.end_time != undefined){
                this.end_time = transaction.end_time;
            }
            //backwards capatability with transaction database entries without start_time
            if(transaction.start_time != undefined) {
                this.start_time = transaction.start_time;
            }

            if(transaction.notified != undefined){
                this.notified = transaction.notified; 
            }
            
            
            this.active = transaction.active;
        },
        //user is an instance of the user that's sending the message
        sendChatMessage: function (user, text) {
            //sends a message to the current conversation
            //current_transaction cannot be null
            if (this.conversation == null) {
                throw {message: "sendChatMessage: tried to send message to null Conversation"};
            }

            if(user._id.toString() != this.buyer_user_id.toString() && user._id.toString() != this.seller_user_id.toString()){
                throw {message: "sendChatMessage: user with id " + user._id + " doesn't match either user_id of the users in the transaction"}
            }
            //(Message(text, username, time_sent)
            var message = new Message(text, user._id, new Date().getTime());
            this.conversation.sendChatMessage(message);
            return message;
        },
        //TODO: the below modifications should be done atomically so as the avoid race conditions
        //both buy and sell user_id are defined at transaction creation
        //1. verify that exactly one user_accept_request bool is null, i.e transaction hasn't already been started
        //2. verify that one of the user_accept_requests is null and set that to true
        acceptRequest: function (user_id) {
            if(this.active == true) {
                //TODO: check whether user_id is of buyer or of seller, then set the appropriate accept_request value
                //we must use the call function in order to pass 'this' object to private function verifyTransactionNotActivated
                verifyTransactionNotActivatedThenSetAcceptRequest.call(this, user_id, true)
            }
        },
        //throws error if transaction has already been accepted or declined
        declineRequest: function (user_id) {
            if(this.active == true){
                //TODO: check whether user_id is of buyer or of seller, then set the appropriate accept_request value
                //we must use the call function in order to pass 'this' object to private function verifyTransactionNotActivated
                verifyTransactionNotActivatedThenSetAcceptRequest.call(this, user_id, false);
                this.active = false;
            }

        },
        withdrawRequest: function(user_id){
            if(this.active == true){
                if(this.buyer_accepted_request == null || this.seller_accepted_request == null){
                    if(this.buy){
                        if(user_id.toString() == this.seller_user_id.toString()){
                            this.seller_accepted_request = false;
                            this.active = false;
                        }
                        else{
                            throw "Cannot withdraw a transaction request that you did not make!"
                        }
                    }
                    else{
                        if(user_id.toString() == this.buyer_user_id.toString()){
                            this.buyer_accepted_request = false;
                            this.active = false;
                        }
                        else{
                            throw "Cannot withdraw a transaction request that you did not make!"
                        }
                    }
                }
                else{
                    throw "This transaction has already been started, cannot be withdrawn"
                }
            }
            else{
                throw "This transaction is not active, cannot be withdrawn";
            }
        },

        confirm: function (user_id) {
            //TODO: throw error if user_id doesn't match one of the two user_ids of the transactions
            //TODO: set the confirm to true for the appropriate user
            verifyTransactionActiveThenSetConfirmed.call(this, user_id, true);
            console.log(this.title + " " + this.price);
            if(this.isCompleted()){
                this.active = false;
            }
        },
        terminate: function (user_id) {
            //TODO: throw error if user_id doesn't match one of the two user_ids of the transactions
            //TODO: set the confirm to false for the appropriate user
            verifyTransactionActiveThenSetConfirmed.call(this, user_id, false);
            this.active = false;
        },
        //returns whether transaction has been initiated
        isActive: function () {
            var accepted = this.buyer_accepted_request && this.seller_accepted_request
            var notRejected =  this.buyer_confirmed_meet_up != false && this.seller_confirmed_meet_up != false;
            var notConfirmed = !(this.buyer_confirmed_meet_up == true && this.seller_confirmed_meet_up == true);
            return accepted && notRejected && notConfirmed;
        },
        isAccepted: function(){
            return this.buyer_accepted_request && this.seller_accepted_request;
        },
        //TODO: watch out for when both users confirm at the same time.
        isCompleted: function () {
            //TODO: if both confirm_met_up are true then return true;
            if (this.buyer_confirmed_meet_up == true && this.seller_confirmed_meet_up == true) {
                return true;
            }
            return false;
        },
        //given a user_id if it matches one of the two user_ids
        //then return the user_id of the other user in the transaction
        getOtherUserId: function(user_id){
            if(user_id.toString() == this.buyer_user_id.toString()){
                return this.seller_user_id;
            }
            else if(user_id.toString() == this.seller_user_id.toString()){
                return this.buyer_user_id
            }
            else{
                throw {message: "user_id doesn't match either of the user ids in the transaction"};
            }
        },

        isBuyer: function(user_id){
            if(user_id == this.buyer_user_id){
                return true;
            }
            return false;
        },
    }

    return Transaction;
}();

module.exports = Transaction;
