module.exports = Transaction;

//TODO:
//transaction is saved to database when it has been terminated
//note create the transaction before deleting a listing
//note if we had to recreate transaction object from database, we would need a parameter for conversation as well
function Transaction(id, user_buy, user_sell, listing){
    this.id = id;
    this.user_buy = user_buy; //convert to json and save to database
    this.user_sell = user_sell; //convert to json and save to database
    this.conversation = new Conversation(); //convert to json and save to database
    this.listing = listing; //convert to json and then save to database
    this.user_buy_initiate = null; //not added to database
    this.user_sell_initiate = null; // not added to database
    this.user_buy_confirm_meet_up = false; //not added to database
    this.user_sell_confirm_meet_up = false; //not added to database
    //if both initiates are true then that means transaction is active,
    //if both confirms are not null that means transaction is then deactivated
}

Transaction.prototype = {
    constructor: Transaction,
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
    initiate: function(user, willInitiate){
        //this prevents the intitiate state from being changed after both buyer and seller have confirmed
        if(user_buy_initiate != true || user_sell_initiate != true){
            if(user == this.user_buy){
                this.user_buy_initiate = willInitiate;
            }
            else if(user == this.user_sell){
                this.user_sell_initiate = willInitiate;
                //send notification to buyer
            }
            else{
                throw "user does not match user_buy or user_sell for this Transaction"
            }
            if(user_buy_initiate == false){
                //end transaction and notify both user_buy and user_sell that transaction was terminated by buyer
                //or just notify user_sell, still unsure
            }
            else if(user_sell_initiate == false){
                //end transaction and notify both user_buy and user_sell that transaction was terminated by seller
                //or just notify user_buy, still unsure
            }
            else if(user_buy_initiate == true && user_sell_initiate == true){
                //send out a message that makes both users enter into the transaction, i.e initiate transaction
            }
        }
    },
    terminate: function(){
        //TODO:
        //remove the transaction from the ActiveTransactions (that is the only reference to transaction)
        //remove the transaction's transaction id from both users of the transaction's current transactions
        if(this.id != null) {
            this.user_buy.removeTransaction(this.id);
            this.user_sell.removeTransaction(this.id);
        }
    },
}