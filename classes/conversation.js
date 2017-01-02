module.exports = Conversation;

function Conversation(conversation){
    if(conversation == undefined){
        this.messages = [];
    }
    else{
        this.messages = conversation.messages;
    }
}

Conversation.prototype = {
    constructor: Conversation,
    sendChatMessage: function(message){
        this.messages.push(message);
    },
    getMessages: function(){
        return this.messages;
    }
}