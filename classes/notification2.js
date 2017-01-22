function Notification(to_user_id,  message, notification_info) {
    //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
    //this._id (this will be initialized when listing retrieved from database)
    // this._id = _id;
    this.to_user_id = to_user_id;
    this.notification_info = notification_info
    this.message = message;
    this.active = true;
}

Notification.prototype = {
    constructor: Notification,
    //updates the notification to the defined parameters in the passed in object
    update: function (notification) {
        if(notification._id != undefined){
            this._id = notification._id.toString();
        }
        if(notification.to_user_id != undefined){
            this.to_user_id = notification.to_user_id;
        }
        if(notification.transaction_id != undefined){
            this.transaction_id = notification.transaction_id;
        }
        if(notification.active != undefined){
            this.active = notification.active;
        }
        if(notification.message != undefined){
            this.message = notification.message;
        }
    }
}

module.exports = Notification;