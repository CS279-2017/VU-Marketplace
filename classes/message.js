module.exports = Message;


function Message(text, user_id, time_sent){
    this.text = text;
    this.user_id = user_id; //must be username rather than user to avoid circular reference
    //if we ever need the user's info we can look up the user using this username;
    this.time_sent = time_sent;
}

Message.prototype = {
    constructor: Message,
}