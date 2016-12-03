module.exports = UserInfo;

//UserInfo is a subset of the parameters in User
//only includes those parameters that can be viewed by other users i.e private members like password are not returned
function UserInfo(user){
    this._id = user._id
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    // this.email_address = user.email_address;
    this.location = user.location; 
    this.venmo_id = user.venmo_id;
    // this.current_listings_ids = user.current_listings_ids;
    // this.current_transactions_ids = user.current_transactions_ids;

    this.logged_in = user.logged_in;
}