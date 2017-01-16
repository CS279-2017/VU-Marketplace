var User = require("./user2.js");

function UsersCollection(database){
    this.database = database;
    this.collection_users = database.collection('users');
}

UsersCollection.prototype = {
    constructor: UsersCollection,
    add: function(user){

    },
    get: function(user_ids, callback, error_handler){
        if(!(Array.isArray(user_ids))){
            error_handler("user_ids must be an array!")
        }
        var user_id_arr = [];
        for(var i=0; i< user_ids.length; i++){
            user_id_arr.push(toMongoIdObject(user_ids[i].toString()));
        }
        this.collection_users.find({_id: {$in:user_id_arr}}).toArray(function(err, docs) {
            if(docs.length > 0){
                var users_arr = [];
                for(var j=0; j< docs.length; j++){
                    var user = new User();
                    user.update(docs[j]);
                    users_arr.push(user);
                }
                callback(users_arr);
            }
            else{
                error_handler("No users were found");
            }
        });
    },
    getForEmailAddress: function(email_address, callback, error_handler){
        this.collection_users.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var user = new User()
                user.update(docs[0]);
                callback(user);
            }
            else{
                error_handler("User with email_address " + email_address + " was not found");
            }
        });
    },
    remove: function(_id, callback){
        
    },
    size: function(){

    },

    getAll: function(callback){
        this.collection_users.find({active: true}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var active_users = [];
                for(var i=0; i<docs.length; i++){
                    var user = new User();
                    user.update(docs[i]);
                    active_users.push(user);
                }
                callback(active_users);
            }
            else{
                callback([])
            }
        });
    },
    //TODO: find some faster way to search users on socket id, maybe make another hashmap
    getUserBySocketId: function(socket_id, callback){
        this.collection_users.find({socket_id: socket_id}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var user = new User();
                user.update(docs[0]);
                callback(user);
            }
            else{
                callback([])
            }
        });
    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = UsersCollection;
