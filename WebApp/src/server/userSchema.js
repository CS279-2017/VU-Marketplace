/**
 * Created by chris on 2/20/2017.
 */


const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// mongoose.connect(`mongodb://localhost:27017/${VUNETID}`, err => {
//     if (err) {
//         console.error("ERROR: Could not connect to the mongo db. Is `mongod` running?");
//         process.exit();
//     }
// });


const userSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required:  true},
    primary_email: { type: String, required: true, unique: true},
    posts: {type: [String] }
});

const Users = mongoose.model('Users', userSchema);

module.exports = {
    Users,
};