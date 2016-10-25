module.exports = ActiveTransactions;

//current active transactions, adds a transaction to database when it is removed from active transactions
function ActiveTransactions(){
    this.transactions = {};
}

ActiveTransactions.prototype = {
    constructor: ActiveTransactions,
    add: function(transaction){
        active_transactions[transaction.id] = transaction;
        //TODO:
        //Add transaction to database
    },
    remove: function(transaction_id){
        delete active_transactions[transaction_id];
        //TODO:
        //update transaction in database to make inactive
    },
    get: function (transaction_id){
        return active_transactions[transaction_id];
    }
}