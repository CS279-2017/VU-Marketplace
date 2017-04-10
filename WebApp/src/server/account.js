/**
 * Created by Githiora_Wamunyu on 4/9/2017.
 */
var AccountController = function (userModel, session, userSession, mailer) {
    this.crypto = require('crypto');
    this.uuid = require('node-uuid');
    this.ApiResponse = require('./api-response');
    this.ApiMessages = require('./api-messages');
    this.UserProfileModel = require('./user-profile');
    this.userModel = userModel;
    this.session = session;
    this.mailer = mailer;

    this.userSession = userSession;

};

AccountController.prototype.getSession = function () {
    return this.session;
};
AccountController.prototype.setSession = function (session) {
    this.session = session;
};

AccountController.prototype.hashPassword = function (password, salt, callback) {
    // we use pbkdf2 to hash and iterate 10k times by default
    var iterations = 10000,
        keyLen = 64; // 64 bit.
    this.crypto.pbkdf2(password, salt, iterations, keyLen, callback);
};


AccountController.prototype.logon = function(email, password, callback) {

    var me = this;

    me.userModel.findOne({ primary_email: email }, function (err, user) {

        if (err) {
            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }));
        }

        // console.log(user.passwordSalt);
        if (user) {
            console.log('found something');
            me.hashPassword(password, user.passwordSalt, function (err, passwordHash) {

                if (passwordHash == user.passwordHash) {

                    var userProfileModel = new me.UserProfileModel({
                        primary_email: user.primary_email,
                        first_name: user.first_name,
                        last_name: user.last_name
                    });

                    // Save to http session.
                    me.session.userProfileModel = userProfileModel;
                    me.session.id = me.uuid.v4();

                    // Save to persistent session.
                    me.userSession.userId = user._id;
                    me.userSession.sessionId = me.session.id;

                    console.log(me.userSession);

                    me.userSession.save(function (err, sessionData, numberAffected) {

                        if (err) {
                            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }));
                        }

                        if (numberAffected === 1) {
                            // Return the user profile so the router sends it to the client app doing the logon.
                            return callback(err, new me.ApiResponse({
                                success: true, extras: {
                                    userProfileModel: userProfileModel,
                                    sessionId: me.session.id
                                }
                            }));
                        } else {

                            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.COULD_NOT_CREATE_SESSION } }));
                        }
                    });
                } else {
                    return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.INVALID_PWD } }));
                }
            });
        } else {
            console.log('other else');
            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_NOT_FOUND } }));
        }

    });
};

AccountController.prototype.logoff = function () {
    if (this.session.userProfileModel) delete this.session.userProfileModel;
    return;
};

AccountController.prototype.register = function (newUser, callback) {
    var me = this;
    me.userModel.findOne({ primary_email: newUser.primary_email }, function (err, user) {

        if (err) {
            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }));
        }

        if (user) {
            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.EMAIL_ALREADY_EXISTS } }));
        } else {

            newUser.save(function (err, user, numberAffected) {

                if (err) {
                    return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }));
                }

                if (numberAffected === 1) {

                    var userProfileModel = new me.UserProfileModel({
                        primary_email: user.primary_email,
                        first_name: user.first_name,
                        last_name: user.last_name
                    });

                    return callback(err, new me.ApiResponse({
                        success: true, extras: {
                            userProfileModel: userProfileModel
                        }
                    }));
                } else {
                    return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.COULD_NOT_CREATE_USER } }));
                }

            });
        }

    });
};

module.exports = AccountController;