module.exports = ActiveUsers;
var User = require("./user.js");

//TODO: login/logout simply manipulates ActiveUsers, note current user object manipulation all revolve around username
//TODO: may want to change focus to something else, may even want to remove usernames all together and only use real names
//contains all active (online) users
function ActiveUsers(){
    this.users = {};
}
//active_users now indexed by _id rather than username, thus making login indepedent of username
ActiveUsers.prototype = {
    constructor: ActiveUsers,
    initFromDatabase: function(active_users){
        for(var i = 0; i<active_users.length; i++){
            var new_user = new User();
            new_user.initFromDatabase(active_users[i]);
            this.users[new require('mongodb').ObjectID(new_user._id.toString())] = new_user;
        }
    },
    add: function(user){
        if(this.users[user._id] == undefined) {
            this.users[user._id] = user;
            console.log(this.users[user._id].email_address + " has been added to ActiveUsers");
        }
        else{
            throw {message: "user is already logged in, can't login"}
        }

    },
    get: function(_id){
        return this.users[_id];
    },
    remove: function(_id){
        if(this.users[_id] != undefined){
            delete this.users[_id];
            if(typeof this.users[_id] == 'undefined') {
                console.log("user with id " + _id + " has been removed from ActiveUsers");
            }
            else{
                throw {message: "removing user with id " + _id  + " failed"};
            }
        }
        else{
            throw {message: "user is not logged in, can't logout"}
        }
        //we don't delete from database, because database keeps track of all registered users
    },
    size: function(){
        return Object.keys(this.users).length
    },
    //returns an array of all the users
    getAll: function(){
        var users_arr = [];
        for(key in this.users){
            users_arr.push(this.users[key]);
        }
        return users_arr;
    },
    //TODO: find some faster way to search users on socket id, maybe make another hashmap
    getUserBySocketId: function(socket_id){
        for(key in this.users){
            if(this.users[key].socket_id == socket_id){
                return this.users[key];
            }
        }
        return null;
    },
    //clears the active_users, for testing purposes
    clear: function(){
        this.users = {};
    },
}