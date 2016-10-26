module.exports = ActiveUsers;

//TODO: login/logout simply manipulates ActiveUsers, note current user object manipulation all revolve around username
//TODO: may want to change focus to something else, may even want to remove usernames all together and only use real names
//contains all active (online) users
function ActiveUsers(){
    this.users = {};
}
//TODO: what should ActiveUsers be indexed by? username, email_address, _id, or something else?
//TODO:change from indexing by username to indexing by _id, this allows us to remove usernames if necessary, makes username option
ActiveUsers.prototype = {
    constructor: ActiveUsers,
    add: function(user){
        if(this.users[user.username] == undefined) {
            this.users[user.username] = user;
            console.log(this.users[user.username].username + "has been added to ActiveUsers");
        }
        else{
            throw "user is already logged in, can't login"
        }

    },
    get: function(username){
        return this.users[username];
    },
    remove: function(username){
        if(this.users[username] != undefined){
            delete this.users[username];
            if(this.users[username] == undefined) {
                console.log("user with username " + username + " has been removed from ActiveUsers");
            }
            else{
                throw "removing " + username + " failed";
            }
        }
        else{
            throw "user is not logged in, can't logout"
        }
        //we don't delete from database, because database keeps track of all registered users
    },
}