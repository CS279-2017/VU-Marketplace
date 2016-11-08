# mealplanserverapp

###Events Received by Server from Client (Client -> Server)
JSON object will be passed in with all the arguments of each method

1. register_email_address
    * registers an email_address that must then be verified
2. register_verification_code
    * verifies the email_address and creates a user, with username, password, etc.
3. login
    * logs a user in (adds them to active_users)
4. logout
    * logs user out, updates user in database, removes user from active_users
5. make_listing
    * creates a listing, adds to it to active_listings
6. remove_listing

7. make_transaction_request
8. accept_transaction_request
9. decline_transaction_request
10. confirm_transaction
11. reject_transaction

12. update_user_location
13. send_chat_message

14. get_all_active_listings
    * called by client to get returned a updated list of listings
15.


###Events Received by Client from Server (Server -> Client)
JSON object with parameters data and error will be passed in
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
        * also emits an event to all active_users that tells them a new listing has been added
    2. or sends an error
6. remove_listing_response
    1. tells client that they've succesfully made a listing (i.e no error)
        *emits an event to all active_users telling them which listing has been removed
    2. or sends error
7. make_transaction_request_response
    1. emits 'transaction_request(transaction)' to the other user in the transaction
        * tells client that they've succesfully made a transaction_request
    2. or sends error

8. accept_transaction_request_response
    1. tells client their acceptance has been registered
        * if successful emits 'transaction_started(transaction)' to both users
    2. or sends an error

9. decline_transaction_request_response
    1. tells client their rejection has been registered
        * if successful emits an event to other user (requesitng user) that request has been declined
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
listings will be sorted on the client-side



