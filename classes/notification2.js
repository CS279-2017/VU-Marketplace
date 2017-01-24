var apn = require('apn');
var apnProvider = new apn.Provider({
    token: {
        key: 'apnkey.p8', // Path to the key p8 file
        keyId: 'Y3M29GE5QJ', // The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
        teamId: 'DE4758AREF', // The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
    },
    production: false // Set to true if sending a notification to a production iOS app
});


function Notification(to_user_id, message, notification_info) {
    //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
    //this._id (this will be initialized when listing retrieved from database)
    // this._id = _id;
    this.to_user_id = to_user_id;
    this.listing_id = notification_info.payload.listing_id;
    this.message = message;
    this.notification_info = notification_info
    this.active = true;
    this.time_sent = new Date().getTime()
}

Notification.prototype = {
    constructor: Notification,
    send: function(device_token, callback, error_handler){
        sendNotification(device_token, this.notification_info, callback, error_handler);
    },
    //updates the notification to the defined parameters in the passed in object
    update: function (notification) {
        if(notification._id != undefined){
            this._id = notification._id.toString();
        }
        if(notification.to_user_id != undefined){
            this.to_user_id = notification.to_user_id;
        }
        if(notification.listing_id != undefined){
            this.listing_id = notification.listing_id;
        }
        if(notification.active != undefined){
            this.active = notification.active;
        }
        if(notification.message != undefined){
            this.message = notification.message;
        }
        if(notification.time_sent != undefined){
            this.time_sent = notification.time_sent;
        }
    }
}

function sendNotification(notification_info, device_token, callback, error_handler){
    // Enter the device token from the Xcode console

    var deviceToken = device_token;

// Prepare a new notification
    var notification = new apn.Notification();
    // Specify your iOS app's Bundle ID (accessible within the project editor)
    notification.topic = 'bowen.jin.mealplanappiOS';
    // Set expiration to 1 hour from now (in case device is offline)
    notification.expiry = Math.floor(Date.now() / 1000) + 3600;
    notification_info.badge = 1;
    // Set app badge indicator
    if(notification_info.badge != undefined){
        notification.badge = notification_info.badge;
    }
    if(notification_info.sound != undefined){
        notification.sound = notification_info.sound;
    }
    else{
        notification.sound = "default";
    }
    if(notification_info.alert != undefined){
        notification.alert = notification_info.alert;
    }
    if(notification_info.payload != undefined){
        notification.payload = notification_info.payload;
    }
    if(notification_info.category != undefined){
        notification.category = notification_info.category;
    }
    // Actually send the notification

    apnProvider.send(notification, deviceToken).then(function(result) {
        // Check the result for any failed devices
        console.log(result);
        console.log(device_token);
        callback();
    });

}

module.exports = Notification;