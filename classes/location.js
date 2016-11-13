module.exports = Location;

function Location(x,y){
    this.x = x;
    this.y = y; //must be username rather than user to avoid circular reference
    //if we ever need the user's info we can look up the user using this username;
    // 
    this.last_update = new Date().getTime();
}

Location.prototype = {
    constructor: Location,
    update: function(latitude, longitude){
        this.latitude = latitude;
        this.longitude = longitude;
        this.last_update = new Date().getTime();
    }
}