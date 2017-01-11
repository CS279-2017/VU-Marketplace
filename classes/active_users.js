module.exports = ActiveUsers;
var User = require("./user.js");

// var database = require("../app.js").database;
//
// var 



//TODO: login/logout simply manipulates ActiveUsers, note current user object manipulation all revolve around username
//TODO: may want to change focus to something else, may even want to remove usernames all together and only use real names
//contains all active (online) users
function ActiveUsers(database){
    this.database = database;
    this.collection_users = database.collection('users');
    // this.user_id_to_user = {};
}
//active_users now indexed by _id rather than username, thus making login indepedent of username
ActiveUsers.prototype = {
    constructor: ActiveUsers,
    initFromDatabase: function(active_users){
        // for(var i = 0; i<active_users.length; i++){
        //     var new_user = new User();
        //     new_user.initFromDatabase(active_users[i]);
        //     this.user_id_to_user[new require('mongodb').ObjectID(new_user._id.toString())] = new_user;
        // }
    },
    add: function(user){
        // if(this.user_id_to_user[toMongoIdObject(user._id)] == undefined) {
        //     this.user_id_to_user[toMongoIdObject(user._id)] = user;
        //     console.log(this.user_id_to_user[toMongoIdObject(user._id)].email_address + " has been added to ActiveUsers");
        // }
        // else{
        //     throw {message: "user is already logged in, can't login"}
        // }

    },
    get: function(_id, callback){
        this.collection_users.find({_id: toMongoIdObject(_id)}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var user = new User()
                user.initFromDatabase(docs[0]);
                callback(user);
            }
            else{
                callback()
            }
        });
        // return this.user_id_to_user[toMongoIdObject(_id)];
        
    },
    getForEmailAddress: function(email_address, callback){
        // var active_users = this.getAll();
        // for(var i = 0; i <active_users.length; i++){
        //     var user = active_users[i]
        //     if(user.email_address == email_address){
        //         return user;
        //     }
        // }
        this.collection_users.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var user = new User()
                user.initFromDatabase(docs[0]);
                callback(user);
            }
            else{
                callback()
            }
        });
    },
    remove: function(_id){
        // if(this.user_id_to_user[_id] != undefined){
        //     delete this.user_id_to_user[_id];
        //     if(typeof this.user_id_to_user[_id] == 'undefined') {
        //         console.log("user with id " + _id + " has been removed from ActiveUsers");
        //     }
        //     else{
        //         throw {message: "removing user with id " + _id  + " failed"};
        //     }
        // }
        // else{
        //     throw {message: "user is not logged in, can't logout"}
        // }
        //we don't delete from database, because database keeps track of all registered users
    },
    size: function(){
        // return Object.keys(this.user_id_to_user).length
    },
    //returns an array of all the users
    getAll: function(callback){
        this.collection_users.find({active: true}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var active_users = [];
                for(var i=0; i<docs.length; i++){
                    var user = new User();
                    user.initFromDatabase(docs[i]);
                    active_users.push(user);
                }
                callback(active_users);
            }
            else{
                callback([])
            }
        });
        // var users_arr = [];
        // for(key in this.user_id_to_user){
        //     users_arr.push(this.user_id_to_user[key]);
        // }
        // return users_arr;
    },
    //TODO: find some faster way to search users on socket id, maybe make another hashmap
    getUserBySocketId: function(socket_id, callback){
        this.collection_users.find({socket_id: socket_id}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var user = new User();
                user.initFromDatabase(docs[0]);
                callback(user);
            }
            else{
                callback([])
            }
        });
        // for(key in this.user_id_to_user){
        //     if(this.user_id_to_user[key].socket_id == socket_id){
        //         return this.user_id_to_user[key];
        //     }
        // }
        // return undefined;
    },
    //clears the active_users, for testing purposes
    // clear: function(){
    //     this.user_id_to_user = {};
    // },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}
