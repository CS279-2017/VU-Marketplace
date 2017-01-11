module.exports = Location;

function Location(latitude,longitude){
    this.latitude = latitude;
    this.longitude = longitude; //must be username rather than user to avoid circular reference
    //if we ever need the user's info we can look up the user using this username;
    // 
    this.last_update_time = new Date().getTime();
}

Location.prototype = {
    constructor: Location,
    initFromDatabase: function(location){
        if(location != null && location != undefined){
            this.latitude = location.latitude;
            this.longitude = location.longitude;
            this.last_update_time = location.last_update_time;
        }

    },
    update: function(latitude, longitude){
        this.latitude = latitude;
        this.longitude = longitude;
        this.last_update_time = new Date().getTime();
    },
    //returns distance in meters;
    getDistanceFrom: function(location) {
        function deg2rad(deg) {
            return deg * (Math.PI/180)
        }
        
        var lat1 = location.latitude;
        var lon1 = location.longitude;
        var lat2 = this.latitude;
        var lon2 = this.longitude;

        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1);
        var a =
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d * 1000;
    } ,
}