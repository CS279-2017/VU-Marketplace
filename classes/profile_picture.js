function ProfilePicture(user_id, binary_data){
    // this._id = undefined;
    this.user_id = user_id
    this.binary_data = binary_data;
    this.last_modified_time = new Date().getTime()
}

ProfilePicture.prototype = {
    constructor: ProfilePicture,
    update: function(profile_picture){
        if(profile_picture._id != undefined){
            this._id = profile_picture._id.toString();
        }
        if(profile_picture.text != undefined){
            this.user_id = profile_picture.user_id;
        }
        if(profile_picture.binary_data != undefined){
            this.binary_data = profile_picture.binary_data;
        }
        if(profile_picture.last_modified_time != undefined){
            this.last_modified_time = profile_picture.last_modified_time;
        }
    }
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = ProfilePicture;