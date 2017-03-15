/**
 * Created by chris on 2/20/2017.
 */

let fs              = require('fs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var imgPath = '../../public/img/b.jpg'
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error);
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
    username:{type: String, required: true, unique: true} //VUnet id
});

const imgSchema = new Schema({
    img: { data: Buffer, contentType: String }
});

const postSchema = new Schema ({        //will need to add more requirements as needed
    title: {type: String, required: true},
    description: {type: String, required: true},
    img: { data: Buffer, contentType: String }, //TO DO: unsure how to store images https://docs.mongodb.com/manual/core/gridfs/
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    price: {type: String, required: true},
    tag: {type: String, required: true},
    owner: {type: String, required:true} //VUNET ID
});

const User = mongoose.model('User   ', userSchema);
const Post = mongoose.model('Post', postSchema);
const Img = mongoose.model('Img', imgSchema);

// empty the collection
/*Img.remove(function (err) {
    if (err){
        throw err;
    } else {
        console.log("Img Container emptied");
    }
});*/

var a = new Img;
a.img.data = fs.readFileSync(imgPath);
a.img.contentType = 'image/jpg';
a.save(function (err) {
    if (err) throw err;
});
console.log("img saved to data base");

module.exports = {
    User,
    Post,
};