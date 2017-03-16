/**
 * Created by chris on 2/20/2017.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://54.159.195.212:27017/`, err => {
    if (err) {
        console.error("ERROR: Could not connect to the mongo db. Is `mongod` running?");
        process.exit();
    }else{
        console.log("Connected to MongoDB");
    }
});


const userSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required:  true},
    primary_email: { type: String, required: true, unique: true}, //vanderbilt email address
    vunetid:{type: String, required: true, unique: true} //VUnet id
});

const postSchema = new Schema ({        //will need to add more requirements as needed
    title: {type: String, required: true},
    description: {type: String, required: true},
    //img: { data: Buffer, contentType: String }, //TO DO: unsure how to store images https://docs.mongodb.com/manual/core/gridfs/
    startDate: {type: Date, required: true},
    price: {type: String, required: true},
    tag: {type: String, required: true},
    vunetid: {type: String, required:true} //VUNET ID
});

const User = mongoose.model('User   ', userSchema);
const Post = mongoose.model('Post', postSchema);

module.exports = {
    User,
    Post,
};