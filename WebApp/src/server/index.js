/**
 * Created by chris on 2/20/2017.
 */

'use strict';

let express         = require('express'),
    bodyParser      = require('body-parser'),
    logger          = require('morgan'),
    _               = require('underscore'),
    session         = require('express-session'),
    User            = require('./userSchema'),
    mongoose        = require('mongoose');


mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error);

let app = express();
app.use(express.static('../../public'));
app.use(logger('combined'));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }
}));


// mongoose.connect("mongodb://192.168.99.100:32776/leecp", function(error, db) {
//     if(!error){
//         console.log("We are connected");
        let server = app.listen(8080, function () {
            console.log('Example app listening on ' + server.address().port);
        });
//     }
//     else
//         console.dir(error);
// });