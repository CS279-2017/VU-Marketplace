var Transaction = require("./transaction.js");
//current active transactions, adds a transaction to database when a transaction is initiated
//remove transaction from active_transactions when it has completed or has been declined and never intiated
//transactions database contains both complete and incomplete transactions (can use Transaction variables to determine
//the category of a transaction

function ActiveTransactions(){
    this.transactions_id_to_transaction_map = {};

    this.user_id_to_transactions_map = {};
    this.transaction_id_to_user_id_map = {};

    this.listing_id_to_transactions_map = {};
    this.transaction_id_to_listing_id_map = {};
}

ActiveTransactions.prototype = {
    constructor: ActiveTransactions,
    initFromDatabase: function(active_transactions){
        for(var i = 0; i<active_transactions.length; i++){
            var new_transaction = new Transaction();
            new_transaction.initFromDatabase(active_transactions[i]);
            this.add(new_transaction);
        }
    },
    add: function(new_transaction){
        this.transactions_id_to_transaction_map[new_transaction._id] = new_transaction;

        var buyer_user_id = toMongoIdObject(new_transaction.buyer_user_id.toString())
        if(this.user_id_to_transactions_map[buyer_user_id] == undefined){
            this.user_id_to_transactions_map[buyer_user_id] = [];
        }
        this.user_id_to_transactions_map[buyer_user_id].push(new_transaction);

        var seller_user_id = toMongoIdObject(new_transaction.seller_user_id.toString())

        if(this.user_id_to_transactions_map[seller_user_id] == undefined){
            this.user_id_to_transactions_map[seller_user_id] = [];
        }
        this.user_id_to_transactions_map[seller_user_id].push(new_transaction);

        if(this.transaction_id_to_user_id_map[new_transaction._id] == undefined){
            this.transaction_id_to_user_id_map[new_transaction._id] = [];
        }
        this.transaction_id_to_user_id_map[new_transaction._id].push(buyer_user_id);
        this.transaction_id_to_user_id_map[new_transaction._id].push(seller_user_id);

        //every transaction has two users, but every user can have mutliple transactions

        var listing_id = toMongoIdObject(new_transaction.listing_id.toString())
        if(this.listing_id_to_transactions_map[listing_id] == undefined){
            this.listing_id_to_transactions_map[listing_id] = [];
        }
        this.listing_id_to_transactions_map[listing_id].push(new_transaction);
        //there can be multiple transactions per listing

        this.transaction_id_to_listing_id_map[new_transaction._id] = listing_id;
        //but every transaction can only have 1 listing
    },
    remove: function(transaction_id){
        delete this.transactions_id_to_transaction_map[transaction_id];

        var user_id1 = this.transaction_id_to_user_id_map[transaction_id][0];
        var user_id2 = this.transaction_id_to_user_id_map[transaction_id][1];
        delete this.transaction_id_to_user_id_map[transaction_id];


        var user1_transactions = this.user_id_to_transactions_map[user_id1];
        if(user1_transactions != undefined){
            for(var i=0; i<user1_transactions.length; i++){
                if(user1_transactions[i]._id == transaction_id){
                    user1_transactions.splice(i, 1);
                }
            }
            if(user1_transactions.length == 0){delete this.user_id_to_transactions_map[user_id1];}
        }


        var user2_transactions = this.user_id_to_transactions_map[user_id2];
        if(user2_transactions != undefined){
            for(var i=0; i<user2_transactions.length; i++){
                if(user2_transactions[i]._id == transaction_id){
                    user2_transactions.splice(i, 1);
                }
            }
            if(user2_transactions.length == 0){delete this.user_id_to_transactions_map[user_id2];}
        }

        var listing_id = this.transaction_id_to_listing_id_map[transaction_id];
        if(listing_id != undefined){
            delete this.transaction_id_to_listing_id_map[transaction_id];
        }

        var listing_transactions = this.listing_id_to_transactions_map[listing_id];
        if (listing_transactions != undefined){
            for(var i=0; i<listing_transactions.length; i++){
                if(listing_transactions[i]._id == transaction_id){
                    listing_transactions.splice(i, 1);
                }
            }
            if(listing_transactions.length == 0){delete this.listing_id_to_transactions_map[listing_id];}
        }
        // this.user_id_to_transactions_map[new_transaction.buyer_user_id].push(new_transaction);
        //
        // if(this.user_id_to_transactions_map[new_transaction.seller_user_id] == undefined){
        //     this.user_id_to_transactions_map[new_transaction.seller_user_id] = [];
        // }
        // this.user_id_to_transactions_map[new_transaction.seller_user_id].push(new_transaction);
        //
        // if(this.listing_id_to_transactions_map[new_transaction.listing_id] == undefined){
        //     this.listing_id_to_transactions_map[new_transaction.listing_id] = [];
        // }
        // this.listing_id_to_transactions_map[new_transaction.listing_id].push(new_transaction);
    },
    get: function (transaction_id){
        return this.transactions_id_to_transaction_map[transaction_id];
        // if(typeof transaction == 'undefined'){
        //     console.log("transaction not found: ")
        //     console.log(transaction_id);
        //     console.log(this.transactions)
        //     // throw {message: "active_transactions.get: transaction with id " + transaction_id + " wasn't found"};
        // }
    },
    size: function(){
        return Object.keys(this.transactions_id_to_transaction_map).length
    },
    //gets all transactions involving a user with a given user_id
    //TODO: find a better way to perform these searching functions
    getAllForUser: function(user_id){
        // var transactions_arr = [];
        // for(transaction_id in this.transactions_id_to_transaction_map) {
        //     var transaction = this.transactions_id_to_transaction_map[transaction_id];
        //     if (user_id == transaction.buyer_user_id || user_id == transaction.seller_user_id) {
        //         transactions_arr.push(transaction);
        //
        //     }
        // }
        // return transactions_arr;
        var transactions =  this.user_id_to_transactions_map[user_id];
        if(transactions == undefined){ return []; }
        return transactions;
    },
    getAllForListingId: function(listing_id){
        // var transactions_arr = [];
        // // for(transaction_id in this.transactions_id_to_transaction_map){
        // //     var transaction = this.transactions_id_to_transaction_map[transaction_id];
        // //     // console.log(transaction)
        // //     if(transaction.listing_id == listing_id){
        // //         transactions_arr.push(transaction);
        // //     }
        // // }
        // return transactions_arr;
        var transactions = this.listing_id_to_transactions_map[listing_id];
        if(transactions == undefined){ return []; }
        return transactions;

    },
    //returns an array of all the transactions
    getAll: function(){
        var transactions_arr = [];
        for(key in this.transactions_id_to_transaction_map){
            transactions_arr.push(this.transactions_id_to_transaction_map[key]);
        }
        return transactions_arr;
    },
    //clears the active_transactions, for testing purposes
    clear: function() {
        this.transactions_id_to_transaction_map = {};

        this.user_id_to_transactions_map = {};
        this.transaction_id_to_user_id_map = {};

        this.listing_id_to_transactions_map = {};
        this.transaction_id_to_listing_id_map = {};
    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = ActiveTransactions;
