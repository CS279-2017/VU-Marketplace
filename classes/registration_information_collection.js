var RegistrationInformation = require("./registration_information.js");
var nodemailer = require('nodemailer');

var registrationAttemptsLimit = 5;

var transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
        // user: 'mealplanapp@gmail.com', // Your email id
        // pass: 'chocho513' // Your password
        user: 'mealplanapp',
        pass: 'chocho513'
    }
});

function RegistrationInformationCollection(database){
    this.database = database;
    this.collection_registration_information = database.collection('registration_information');
}

RegistrationInformationCollection.prototype = {
    constructor: RegistrationInformationCollection,
    registerEmail: function(email_address, callback, error_handler){
        //generate verification_code
        var verification_code = generateVerificationCode(6);
        console.log(verification_code);
        var registration_information = new RegistrationInformation(email_address);
        registration_information.verification_code = verification_code;
        var collection_registration_information = this.collection_registration_information;
        this.collection_registration_information.find({email_address: email_address, registered: true}).toArray(function(err, docs) {
            if (!err) {
                if (docs.length == 0) {
                    sendEmail(email_address, verification_code);
                    collection_registration_information.findAndModify(
                        {email_address: email_address},
                        [],
                        {$set: registration_information},
                        {new: true, upsert: true},
                        function (err, docs) {
                            if (!err) {
                                var value = docs.value;
                                if (callback != undefined) {
                                    callback(value);
                                }
                            }
                            else {
                                console.log(err);
                                console.log("collection.registration_information.findAndModify error");
                                error_handler("An error occured!")
                            }
                        }
                    );
                }
                else {
                    error_handler("This email address has already been registered!")
                    return;
                }
            }
            else {
                error_handler("An error occured while registering your email!");
                return;
            }
        });
    },
    registerVerificationCode: function(verification_code, email_address, password, callback, error_handler){
        var collection_registration_information = this.collection_registration_information;
        this.collection_registration_information.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length == 1) {
                var registration_information = docs[0]
                if (registration_information.registration_attempts < registrationAttemptsLimit) {
                    if (registration_information.verification_code == verification_code) {
                        if (registration_information.registered == false) {
                            collection_registration_information.update({email_address: email_address}, {$set: {registered: true}}, function (err, count, status) {
                                if (!err) {
                                    callback();
                                }
                                else {
                                    console.log(err);
                                    console.log("setting registered to true failed");
                                    error_handler("An error occured while registering!")
                                }
                            });
                        }
                        else {
                            console.log("This email has already been registered!")
                            error_handler("This email has already been registered!")
                        }
                    }
                    else {
                        collection_registration_information.update({email_address: email_address}, {$inc: {registration_attempts: 1}}, function (err, count, status) {
                            if (!err) {
                                error_handler("Invalid verification code")
                            }
                            else {
                                console.log("error occured while updating registration attempts")
                                error_handler("An error occurred");
                            }
                        })
                    }
                }
                else{
                    console.log("Too many registration attempts, please resend verification code");
                    error_handler("Too many registration attempts, please resend verification code");
                }
            }
            else{
                error_handler("Invalid email address");
            }
        });
    },
    resetPasswordEmail: function(email_address, callback, error_handler){
        var collection_registration_information = this.collection_registration_information;
        this.collection_registration_information.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length == 1){
                //generate reset_password_verification_code
                var reset_password_verification_code = generateVerificationCode(6)
                console.log(reset_password_verification_code);

                //send email
                sendEmail(email_address, reset_password_verification_code);
                collection_registration_information.findAndModify(
                    {email_address: email_address},
                    [],
                    {$set: {reset_password_verification_code: reset_password_verification_code , reset_password_attempts: 0, password_reset: false}},
                    {new: true},
                    function (err, docs) {
                        if(!err){
                            var value = docs.value;
                            if(callback != undefined){ callback(value); }
                        }
                        else{
                            console.log("collection_registration_information.findAndModify error");
                            error_handler("An Error Occured while Resetting Password!")
                        }
                    }
                );
            }
            else if(docs.length > 1){
                error_handler("There are duplicate email_addresses")
            }
            else{
                error_handler("This email address hasn't been registered");
                console.log("This email address hasn't been registered");
            }
        });
    },
    resetPasswordVerificationCode: function(verification_code, email_address, password, callback, error_handler){
        var collection_registration_information = this.collection_registration_information;
        this.collection_registration_information.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length == 1){
                var registration_information = docs[0]
                if(registration_information.reset_password_attempts < registrationAttemptsLimit){
                    if(registration_information.reset_password_verification_code == verification_code){
                        if(registration_information.password_reset == false){
                            collection_registration_information.update({email_address: email_address}, {$set: {password_reset: true}}, function (err, count, status) {
                                if (!err) {
                                    callback();
                                }
                                else {
                                    console.log(err);
                                    console.log("setting password_reset to true failed");
                                    error_handler("An error occured while resetting password!")
                                }
                            });
                        }
                        else{
                            console.log("This verification code has already been used to reset password")
                            error_handler("This verification code has already been used to reset password")
                        }
                    }
                    else{
                        collection_registration_information.update({email_address: email_address}, {$inc: {password_reset_attempts: 1}}, function (err, count, status) {
                            if(!err){
                                error_handler("Invalid password reset verification code")
                            }
                            else{
                                console.log("error occured while updating password reset attempts")
                                error_handler("An error occurred");
                            }
                        })
                    }
                }
                else{
                    console.log("Too many password reset attempts, please resend verification code");
                    error_handler("Too many password reset attempts, please resend verification code");
                }

            }
            else{
                error_handler("Invalid email address");
            }
        });
    },
    get: function(registration_information_ids, callback, error_handler){
        if(!(Array.isArray(registration_information_ids))){
            error_handler("registration_information_ids must be an array!")
        }
        var registration_information_id_arr = [];
        for(var i=0; i<registration_information_ids.length; i++){
            registration_information_id_arr.push(toMongoIdObject(registration_information_ids[i].toString()));
        }
        this.collection_registration_information.find({_id: {$in:registration_information_id_arr}}).toArray(function(err, docs) {
            if(docs.length > 0){
                var registration_information_arr = [];
                for(var j=0; j< docs.length; j++){
                    var registration_information = new RegistrationInformation();
                    registration_information.update(docs[j]);
                    registration_information_arr.push(registration_information);
                }
                callback(registration_information_arr);
            }
            else{
                error_handler("Noregistration_information were found");
            }
        });
    },
    getForEmailAddress: function(email_address, callback, error_handler){
        this.collection_registration_information.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var registration_information = docs[0]
                callback(registration_information);
            }
            else{
                error_handler("RegistrationInformation with email_address " + email_address + " was not found");
            }
        });
    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

function sendEmail(email_address, verification_code){
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"VandyList" <mealplanapp@gmail.com>', // sender address
        to: email_address, // list of receivers
        subject: 'Verification Code for VandyList', // Subject line
        text: 'Verification Code: ' + verification_code, // plaintext body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
        //send verification_code to callback as well as email (for testing purposes)
    });
}

function generateVerificationCode(length){
    var text = "";
    // var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var possible = "0123456789";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

module.exports = RegistrationInformationCollection;