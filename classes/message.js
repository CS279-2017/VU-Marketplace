module.exports = Message;


function Message(text, username, time_sent){
    this.text = text;
    this.username = username; //must be username rather than user to avoid circular reference
    //if we ever need the user's info we can look up the user using this username;
    this.time_sent = time_sent;
}

Message.prototype = {
    constructor: Message,
    converToJSON: function(){
        return JSON.stringify(this, function( key, value) {
            if (key == 'user') {
                return user.convertToJSON();
            } else{
                return value;
            }
        });
    }
}