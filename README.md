# mealplanserverapp

##TODO:
* 1 minute countdown timer for accepting a transaction request
* add ability to add tags
* add limit on number of transactions per user to 3 and the number of listings to 5

##COMPLETED:
* ~add ability to upload profile picture~


###Events Received by Server from Client (Client -> Server)
1. register_email_address({email_address:String}) -> register_email_address_response({data: null, error: null})
    * registers an email_address that must then be verified
    * sends a verification_code to email_address
2. register_verification_code({verification_code:String, username:String, password:String, email_address:String}) -> register_verification_code_response({data: null, error: null})
    * verifies the email_address and creates a user, with username, password, etc.
3. login({username:String, password:String}) -> login_response({data: {user_id:String}, error: null})
    * logs a user in (adds them to active_users)
    * returns user_id on success
4. logout({user_id:String, password:String}) -> logout_response({data: null, error: null})
    * logs user out, updates user in database, removes user from active_users
    * returns null on success
5. make_listing({user_id:String, password:String, title:String, description:String, location:{x:Integer, y: Integer}, expiration_time:Integer, price:Integer, buy:Boolean}) -> make_listing_response{data: null, error: null})
    * creates a listing, adds to it to active_listings
    * returns null on success
6. remove_listing({user_id:String,  password:String, listing_id, String}) -> remove_listing_response({data: {listing_id: String}, error: null})
    * removes the listing with the listing_id id from active_listings
      * before removing saves to database
    * returns listing_id of the removed listing
7. make_transaction_request
    * 
8. accept_transaction_request
9. decline_transaction_request
10. confirm_transaction
11. reject_transaction

12. update_user_location
13. send_chat_message

14. get_all_active_listings
    * called by client to get returned a updated list of listings
15. get_user(user_id)
    * returns an user_info object containing non-private data members of user
16. get_listing(listing_id)
    * returns a listing_info object containing non-private data members of listing


###Events Received by Client from Server (Server -> Client) as Responses
JSON object with parameters data and error will be passed in {data:{}, error:{}}
The data parameter will contain an object containing callback values returned by a successful method call, will be null if error
The error parameter will contain the error message, will be null if successful

1. register_email_address_response
    1. tells client that their email_address has been stored in database, now client must enter verification code and register account info
    2. or sends error message

2. register_verification_code_response
    1. tells client that they've successfully registered
    2. or sends error

3. login_response
    1. tells clients that they've successfully logged in (sends back user_id)
    2. or sends error

4. logout_response
    1. tells client that they've succesfully logged out
    2. or sends error

5. make_listing_response
    1. tells client that they've successfully made a listing (i.e doesn't send error)
        * emits listing_made to all active_users that tells them a new listing has been added
    2. or sends an error
6. remove_listing_response
    1. tells client that they've succesfully made a listing (i.e no error)
        * emits listing_removed to all active_users telling them which listing has been removed
    2. or sends error
7. make_transaction_request_response
    1. emits 'transaction_request_made(transaction)' to the other user in the transaction
        * tells client that they've succesfully made a transaction_request
    2. or sends error

8. accept_transaction_request_response
    1. tells client their acceptance has been registered
        * if successful emits 'transaction_started(transaction)' to both users
    2. or sends an error

9. decline_transaction_request_response
    1. tells client their rejection has been registered
        * if successful emits 'transaction_declined' an event to other user (requesitng user) that request has been declined
    2. or sends error

10. confirm_transaction_response
    1. tells client that their confirmation has been registered
      * emit 'transaction_confirmed' to both that a user has confirmed transaction
      * if both users have confirmed, emit 'transaction_completed', telling users transaction is terminated, and payment must be made
    2. or sends error

11. reject_transaction_response
    1. tells client that their rejection has been registered
      * if rejection is successful, emit "transaction_rejected" both users, telling user that transaction is terminated
    2. or sends error

12. update_user_location_response
    1. tells client that their location has been successfully updated
      *if successful update, then emit 'user_location_updated' to all clients in a transaction with this user that their location has changed
    2. or sends error

13. send_chat_message_response
    1. tells client that their chat message has been successfully sent
      * if successfully sent message, then emit 'chat_message_sent' to both users in the transaction that a new message has been added to conversation
    2. or sends error

14. get_all_active_listings response
    1. send the listings back the client
    2. or send an error
  * listings will be sorted on the client-side
  
15. get_listing_response(listing_id)

16. get_user_response(user_id)

###Events Received by Client from Server (Server -> Client) that are Initiated by Server
1. listing_made(listing)
  * notifies all active_users that a new listing has been made, client should update UI with new listing

2. listing_removed(listing_id)
  * notifies all active_users that a listing has been removed, client should update UI by removing listing with the listing_id

3. transaction_request_made(user_id, listing_id)
  * notifies that owner of the listing that a transaction request has been made from some user, 
  * gives user_id being requested

4. transaction_started(transaction)
  * notifies both users of a transaction that a transaction has started
  * passes back the transaction object
  * reflect the change in the UI, by making a screen for the transaction

5. transaction_declined(transaction_id)
  * transaction_id identifies which transaction was declined
  * notifies maker of a transaction that their transaction has been declined 
  * remove transaction from list of "Requested Transactions"
  
6. transaction_confirmed(user_id, transaction_id)
  * transaction_id identifies which transaction was confirmed, user_id identifies which user_confirmed, update this information in the transaction screen
  * notify both users that transaction has been confirmed
  * change the screen for the transaction to the finishing screen or payment screen 
  
7. transaction_completed(transaction_id)
  * transaction_id identifies which transaction was completed
  * change screen to payment screen/ receipt screen/ or any other screen signaling the end of a transaction
  
8. transaction_rejected(transaction_id)
  * transaction_id identifies which transaction was rejected
  * change screen to rejection screen, showing that a transaction was rejected
  
9. user_location_updated(user_id, transaction_id, new_location)
  * gives the client the user_id of the user whose location has been updated
  * update the map UI of the transaction identified by transaction_id so that the user with user_id is at the new_location

10. chat_message_sent(transaction_id, message){
  * updates the chat in the transaction by adding the message to it
    * message should contain the user_id and message_content as well as date
    
    
    
###device_id
* the mealplanapp can only be used from one device at a time otherwise location data would be messed up
* therefore the mealplanapp will only only authenticate one device
* to enforce this, login and authenticate will accept an additional parameter called device_id

* Upon Login
    * if the email and password are correct
        * if device_id = "" (empty string)
            * server will send back a randomly generated unique device key and update the device_id to the the new device_id
            * the client should save this
        * if device key is not "" then the device_id will be updated
            * this way future authentications on the old device will be invalid
    * if email and password are incorrect then reject login as before
    
* Upon Authentication
    * all three user_id, password, and device_id must be correct







