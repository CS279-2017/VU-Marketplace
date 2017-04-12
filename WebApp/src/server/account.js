/**
 * Created by Githiora_Wamunyu on 4/9/2017.
 */
var AccountController = function (userModel, session, mailer) {
    this.crypto = require('crypto');
    this.uuid = require('node-uuid');
    this.ApiResponse = require('./api-response');
    this.ApiMessages = require('./api-messages');
    this.UserProfileModel = require('./user-profile');
    this.userModel = userModel;
    this.session = session;
    this.mailer = mailer;


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


AccountController.prototype.logon = function(vunetid, password, callback) {

    var me = this;

    me.userModel.findOne({ vunetid: vunetid }, function (err, user) {

        if (err) {
            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }));
        }

        if (user) {

            me.hashPassword(password, user.passwordSalt, function (err, passwordHash) {

                if (passwordHash == user.passwordHash) {

                    var userProfileModel = new me.UserProfileModel({
                        vunetid : user.vunetid,
                        primary_email: user.primary_email,
                        first_name: user.first_name,
                        last_name: user.last_name
                    });

                    me.session.userProfileModel = userProfileModel;

                    return callback(err, new me.ApiResponse({
                        success: true, extras: {
                            userProfileModel:userProfileModel
                        }
                    }));
                } else {
                    return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.INVALID_PWD } }));
                }
            });
        } else {
            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.VUNETID_NOT_FOUND } }));
        }

    });
};

AccountController.prototype.logoff = function () {
    if (this.session.userProfileModel) delete this.session.userProfileModel;
    return;
};

AccountController.prototype.register = function (newUser, callback) {
    var me = this;
    me.userModel.findOne({ vunetid: newUser.vunetid }, function (err, user) {

        if (err) {
            console.log('found one: ', err);
            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }));
        }

        if (user) {
            console.log('user: ', user);
            return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.VUNETID_ALREADY_EXISTS } }));
        } else {

            newUser.save(function (err, user, numberAffected) {

                if (err) {
                    return callback(err, new me.ApiResponse({ success: false, extras: { msg: me.ApiMessages.DB_ERROR } }));
                }

                if (numberAffected === 1) {

                    var userProfileModel = new me.UserProfileModel({
                        vunetid : user.vunetid,
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