var Event = function() {
    function Event(name, data, error) {
        //Listing(id, titile, description, location, creation_time, expiration_time, price, buy)
        //this._id (this will be initialized when listing retrieved from database)
        this.name = name;
        this.message = {data: data, error: error};
        this.creation_time = Date().getTime();
    }

    Event.prototype = {
        constructor: Listing,
        initFromDatabase: function (event) {
            this.name = event.name;
            this.message = event.message
            this.creation_time = event.creation_time;
        },
    }

    return Event;
}();


module.exports = Event;