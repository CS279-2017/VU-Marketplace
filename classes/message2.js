

function Message(text, from_user_id, to_user_id, time_sent){
    this.text = text;
    this.from_user_id = user_id;
    this.to_user_id = //must be username rather than user to avoid circular reference
        //if we ever need the user's info we can look up the user using this username;
        this.time_sent = time_sent;
}

Message.prototype = {
    constructor: Message,
    update: function(message){
        if(message.text != undefined){
            this.text = message.text;
        }
        if(message.from_user_id != undefined){
            this.from_user_id = message.user_id;
        }
        if(message.to_user_id != undefined){
            this.to_user_id != message.to_user_id;
        }
        if(message.time_sent != undefined){
            this.time_sent = message.time_sent;
        }
    }
}

module.exports = Message;
