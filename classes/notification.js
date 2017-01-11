/**
 * Created by bowenjin on 1/10/17.
 */

var Notification = function() {
    function Notification(_id, user_id, transaction_id, message) {
        //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
        //this._id (this will be initialized when listing retrieved from database)
        this._id = _id;
        this.user_id = user_id;
        this.transaction_id = transaction_id;
        this.message = message;
        this.active = true;
    }

    Notification.prototype = {
        constructor: Notification,
        initFromDatabase: function (notification) {
            this._id = notification._id;
            this.user_id = notification.user_id;
            this.transaction_id = notification.transaction_id;
            this.message = notification.message;

        }
    }

    return Notification;
}();