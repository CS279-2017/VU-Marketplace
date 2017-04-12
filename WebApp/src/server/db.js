/**
 * Created by chris on 2/20/2017.
 */
"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://54.211.243.192:27017/`, err => {
    if (err) {
        console.error("ERROR: Could not connect to the mongo db. Is `mongod` running?");
        process.exit();
    }else{
        console.log("Connected to MongoDB");
        // User.remove({}, function(err) {
        //     if(err){
        //         console.log(err);
        //     }else{
        //         console.log('collection removed');
        //     }
        //
        // });
    }
});


const userSchema = new Schema({
    vunetid:{type: String, required: true, unique: true}, //VUnet id
    first_name: { type: String, required: true },
    last_name: { type: String, required:  true},
    primary_email: { type: String, required: true, unique: true}, //vanderbilt email address
    passwordHash: String,
    passwordSalt: String
});


let postSchema = new Schema ({        //will need to add more requirements as needed
    title: {type: String, index: true,  required: true},
    description: {type: String, index: true, required: true},
    img: { data: Buffer, contentType: String },
    startDate: {type: Date, required: true},
    price: {type: String, required: true},
    tag: {type: String, index: true, required: true},
    vunetid: {type: String, required:true}, //VUNET ID
});


const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

module.exports = {
    User,
    Post,
};