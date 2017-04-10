/**
 * Created by Githiora_Wamunyu on 4/9/2017.
 */
var UserProfileModel = function(cnf) {
    this.primary_email = cnf.primary_email;
    this.first_name = cnf.first_name;
    this.last_name = cnf.last_name
};
module.exports = UserProfileModel;