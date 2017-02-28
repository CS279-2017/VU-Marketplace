//
//  TransactionController2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/1/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionController2:UIViewController, UITableViewDelegate, UITableViewDataSource{
    
    @IBOutlet weak var segmentedControl: UISegmentedControl!
    @IBOutlet weak var tableView: UITableView!
    
    var users_active_transactions = [Transaction]();
    var users_previous_transactions = [Transaction]();
    var displayed_transactions = [Transaction]();
    
    override func viewDidLoad() {
        super.viewDidLoad();
                
        hideKeyboardWhenTappedAround();
        tableView.delegate = self;
        tableView.dataSource = self;
        tableView.estimatedRowHeight = 150
        tableView.rowHeight = UITableViewAutomaticDimension
        
        tableView.tableHeaderView = UIView();
        tableView.tableFooterView = UIView();
        tableView.backgroundColor = UIColor(red: 247/255, green: 247/255, blue: 247/255, alpha: 1);
        
//        tableView.tableFooterView?.backgroundColor = UIColor(red: 247/255, green: 247/255, blue: 247/255, alpha: 1)
        
        segmentedControl.addTarget(self, action: #selector(segmentedControlValueChanged(segmentedControl:)), for: UIControlEvents.valueChanged);
        segmentedControl.isMomentary = false;
        
        DataStore.get().socket.on("connect", callback: { _ in self.segmentedControlValueChanged(segmentedControl: self.segmentedControl)})
        DataStore.get().socket.on("reconnect", callback: { _ in self.segmentedControlValueChanged(segmentedControl: self.segmentedControl)})
        
        NotificationCenter.default.addObserver(self, selector: #selector(viewWillAppear(_:)), name:
            NSNotification.Name.UIApplicationWillEnterForeground, object: nil)
        
        func transactionRequestMadeListener(data: Any){
            print("transactionRequestMadeListener triggered in TransactionController")
            let data = data as! Dictionary<String, Any>
            let transaction_dictionary = data["transaction"] as! Dictionary<String, Any>;
            let transaction = Transaction(dictionary: transaction_dictionary)
            if let other_user_id = transaction.getOtherUserId(){
                if(DataStore.get().getUserInfo(user_id: other_user_id) == nil){
                    DataStore.get().getUser(user_id: other_user_id, callback: {_ in
                        self.updateDisplayedTransactions();
                    }, error_handler: DataStore.get().error_handler)
                }
                if(DataStore.get().getUserProfilePicture(user_id: other_user_id) == nil){
                    DataStore.get().getProfilePicture(user_id: other_user_id, callback: {_ in
                        self.updateDisplayedTransactions();
                    }, error_handler: DataStore.get().error_handler)
                }
            }
            addTransaction(transaction: transaction) //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        DataStore.get().addListener(listener: transactionRequestMadeListener, forEvent: "transaction_request_made", key: "TransactionController2");
        
        //we only have to be concerned about accepted since transaction gets deleted if declined and the necessary changes are saved to the database
        func transactionRequestAcceptedListener(data: Any){
            print("transactionRequestAcceptedListener triggered in TransactionController")
            let data = data as! Dictionary<String, Any>
            let transaction_id = data["transaction_id"] as! String;
            let user_id = data["user_id"] as! String;
            if let index = users_active_transactions.index(where:  {$0._id == transaction_id}){
                let transaction = users_active_transactions[index];
                if(transaction.buyer_user_id == user_id){
                    transaction.buyer_accepted_request = true;
                }
                else if(transaction.seller_user_id == user_id){
                    transaction.seller_accepted_request = true;
                }
                updateDisplayedTransactions();
            }
                        //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        DataStore.get().addListener(listener: transactionRequestAcceptedListener, forEvent: "transaction_request_accepted", key: "TransactionController2");
        
        
        func transactionStartedListener(data: Any){
            print("transaction_started handler called");
            let data = data as! Dictionary<String, Any>;
            let transaction_id = data["transaction_id"] as! String;
            startTransaction(transaction_id: transaction_id)
        }
        DataStore.get().addListener(listener: transactionStartedListener, forEvent: "transaction_started", key: "TransactionController2");
        
        func transactionRequestDeclinedListener(data: Any){
            print("transaction_declined handler called");
            let data = data as! Dictionary<String, Any>;
            let transaction_id = data["transaction_id"] as! String;
            removeTransaction(transaction_id: transaction_id)
            
        }
        DataStore.get().addListener(listener: transactionRequestDeclinedListener, forEvent: "transaction_request_declined", key: "TransactionController2");
        
        func transactionRequestWithdrawnListener(data: Any){
            print("transaction_withdrawn handler called");
            let data = data as! Dictionary<String, Any>;
            let transaction_id = data["transaction_id"] as! String;
            removeTransaction(transaction_id: transaction_id)
            
        }
        DataStore.get().addListener(listener: transactionRequestWithdrawnListener, forEvent: "transaction_request_withdrawn", key: "TransactionController");
        
        func transactionCompletedListener(data: Any){
            print("transactionCompletedListener triggered in TransactionController")
            let data = data as! Dictionary<String, Any>;
            let transaction_id = data["transaction_id"] as! String;
            removeTransaction(transaction_id: transaction_id)
            //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        DataStore.get().addListener(listener: transactionCompletedListener, forEvent: "transaction_completed", key: "TransactionController2");
        
        func transactionTerminatedListener(data: Any){
            print("transactionCompletedListener triggered in TransactionController")
            let data = data as! Dictionary<String, Any>;
            let transaction_id = data["transaction_id"] as! String;
            removeTransaction(transaction_id: transaction_id) //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        DataStore.get().addListener(listener: transactionTerminatedListener, forEvent: "transaction_terminated", key: "TransactionController2");
    }
    
    override func viewWillAppear(_ animated: Bool) {
        if(DataStore.get().socket_connected){
            segmentedControlValueChanged(segmentedControl: self.segmentedControl);
        }
        initReconnectTimer();
        updateDisplayedTransactions();
    }
    
    func loadActiveTransactions(){
//        showActivityIndicator();
        var userIdSetUserInfo = Set<String>();
        var userIdSetProfilePicture = Set<String>();
        print("loadActiveTransactions called");
        if let userData = UserData.get(){
            let user_id = userData.user_id
            let password = userData.password
            func callback(all_active_transactions: [Dictionary<String, Any>]){
                var new_transactions = [Transaction]();
                for dictionary in all_active_transactions{
                    let transaction = Transaction(dictionary: dictionary);
                    new_transactions.append(transaction)
                    if(DataStore.get().getUserInfo(user_id: transaction.buyer_user_id) == nil){
                        userIdSetUserInfo.insert(transaction.buyer_user_id);
                    }
                    if(DataStore.get().getUserProfilePicture(user_id: transaction.buyer_user_id) == nil){
                        userIdSetProfilePicture.insert(transaction.buyer_user_id)
                    }
                    if(DataStore.get().getUserInfo(user_id: transaction.seller_user_id) == nil){
                        userIdSetUserInfo.insert(transaction.seller_user_id);
                    }
                    if(DataStore.get().getUserProfilePicture(user_id: transaction.seller_user_id) == nil){
                        userIdSetProfilePicture.insert(transaction.seller_user_id)
                    }
                }
                var numberOfProfilePicturesLoaded = 0;
                var numberOfUsersLoaded = 0;
                
                func userLoadedCallback(){
                    numberOfUsersLoaded += 1;
                    if(numberOfUsersLoaded == userIdSetUserInfo.count){
                        updateDisplayedTransactions();
                    }
                }
                
                func profilePictureLoadedCallback(){
                    numberOfProfilePicturesLoaded += 1;
                    if(numberOfProfilePicturesLoaded == userIdSetProfilePicture.count){
                        updateDisplayedTransactions();
                    }
                }
                for userId in userIdSetProfilePicture{
                    DataStore.get().getProfilePicture(user_id: userId, callback: {_,_ in profilePictureLoadedCallback() }, error_handler: {_ in profilePictureLoadedCallback() });
                    
                }
                for userId in userIdSetUserInfo{
                    DataStore.get().getUser(user_id: userId, callback: { _ in userLoadedCallback() }, error_handler: {_ in userLoadedCallback() })
                    
                }
                setActiveTransactions(transactions: new_transactions);
                updateDisplayedTransactions();
//                hideActivityIndicator();
//                self.hideProgressBar();
            }
            if(user_id != nil && password != nil){
//                if(DataStore.get().socket_connected){
//                    self.showProgressBar(msg: "Loading Transactions", true, width: 240)
//                }
                DataStore.get().getUsersActiveTransactions(user_id: user_id!, password: password!, callback: callback, error_handler: DataStore.get().error_handler)
            }
        }
        else{
            print("userData was nil");
        }
    }
    
    func loadPreviousTransactions(){
        var userIdSetUserInfo = Set<String>();
        var userIdSetProfilePicture = Set<String>();

        print("loadPreviousTransactions called");
        if let userData = UserData.get(){
//            showActivityIndicator();
            let user_id = userData.user_id
            let password = userData.password
            func callback(previous_transactions: [Dictionary<String, Any>]){
                var new_transactions = [Transaction]();
                for dictionary in previous_transactions{
                    let transaction = Transaction(dictionary: dictionary);
                    new_transactions.append(transaction)
//                    userIdSet.insert(transaction.buyer_user_id);
//                    userIdSet.insert(transaction.seller_user_id);
                    if(DataStore.get().getUserInfo(user_id: transaction.buyer_user_id) == nil){
                        userIdSetUserInfo.insert(transaction.buyer_user_id);
                    }
                    if(DataStore.get().getUserProfilePicture(user_id: transaction.buyer_user_id) == nil){
                        userIdSetProfilePicture.insert(transaction.buyer_user_id)
                    }
                    if(DataStore.get().getUserInfo(user_id: transaction.seller_user_id) == nil){
                        userIdSetUserInfo.insert(transaction.seller_user_id);
                    }
                    if(DataStore.get().getUserProfilePicture(user_id: transaction.seller_user_id) == nil){
                        userIdSetProfilePicture.insert(transaction.seller_user_id)
                    }
                }
                
                var numberOfProfilePicturesLoaded = 0;
                var numberOfUsersLoaded = 0;
                
                func userLoadedCallback(){
                    numberOfUsersLoaded += 1;
                    if(numberOfUsersLoaded == userIdSetUserInfo.count){
                        updateDisplayedTransactions();
                    }
                }
                
                func profilePictureLoadedCallback(){
                    numberOfProfilePicturesLoaded += 1;
                    if(numberOfProfilePicturesLoaded == userIdSetProfilePicture.count){
                        updateDisplayedTransactions();
                    }
                }
                for userId in userIdSetProfilePicture{
                    DataStore.get().getProfilePicture(user_id: userId, callback: {_,_ in profilePictureLoadedCallback() }, error_handler: {_ in profilePictureLoadedCallback() });
                   
                }
                for userId in userIdSetUserInfo{
                     DataStore.get().getUser(user_id: userId, callback: { _ in userLoadedCallback() }, error_handler: {_ in userLoadedCallback() })
                    
                }
                
                
//                new_transactions.sort {
//                    $0.creation_time > $1.creation_time
//                }
                setPreviousTransactions(transactions: new_transactions);
                updateDisplayedTransactions();
//                hideActivityIndicator();
//                self.hideProgressBar();
            }
            if(user_id != nil && password != nil){
//                if(DataStore.get().socket_connected){
//                    self.showProgressBar(msg: "Loading Transactions", true, width: 240)
//                }
                DataStore.get().getUsersPreviousTransactions(user_id: user_id!, password: password!, callback: callback, error_handler: DataStore.get().error_handler)
            }
        }
        else{
            print("userData was nil");
        }
    }
    
    
    //OPERATIONS ON TRANSACTION ARRAY
    //adds a transaction to the transactions array maintained by controller
    func addTransaction(transaction: Transaction){
        self.users_active_transactions.append(transaction);
        updateDisplayedTransactions();
    }
    
    //removes a transaction to the transactions array maintained by controller
    func removeTransaction(transaction_id: String){
        print("removeTransaction called!")
        let index = users_active_transactions.index(where: {$0._id == transaction_id})
        if(index != nil){
            self.users_active_transactions.remove(at: index!)
        }
        updateDisplayedTransactions();
    }
    
    func setActiveTransactions(transactions: [Transaction]){
        self.users_active_transactions = transactions;
        updateDisplayedTransactions();
    }
    
    func setPreviousTransactions(transactions: [Transaction]){
        self.users_previous_transactions = transactions;
        updateDisplayedTransactions();
    }
    
    //changes a transaction from the request state to the started state
    func startTransaction(transaction_id: String){
        //doesn't the tableView cellForRowAt method automatically pick the correct cell depending on the acceptance booleans in the Transaction object? if so we only need to update cells when startTransaction is called and maybe segue to a screen displaying the transaction
        updateDisplayedTransactions();
        //write segue code here
        //        performSegue(withIdentifier: "TransactionControllerToTransactionViewController", sender: self);
        
        let topViewController = UIApplication.topViewController();
        if !(topViewController is MainController){
            let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
            let controller : TransactionViewController2 = storyBoard.instantiateViewController(withIdentifier: "TransactionViewController2") as! TransactionViewController2
            for transaction in users_active_transactions{
                if(transaction._id == transaction_id){
                    controller.setTransaction(transaction: transaction);
                }
            }
            topViewController?.show(controller, sender: topViewController);
        }
        
        
    }
    
    //updates the tableView after a transactions array is modified
    func updateDisplayedTransactions(){
        print(users_active_transactions);
        var new_displayed_transactions = [Transaction]();
        print("updateDisplayedTransactions called!");
        if(segmentedControl.selectedSegmentIndex == 0){
            for transaction in self.users_active_transactions{
                if(!transaction.hasBeenAcceptedOrDeclined()){
                    new_displayed_transactions.append(transaction);
                }
            }
            new_displayed_transactions.sort{ $0.creation_time > $1.creation_time}
        }
        else if(segmentedControl.selectedSegmentIndex == 1){
            for transaction in self.users_active_transactions{
                if(transaction.isActive()){
                    new_displayed_transactions.append(transaction)
                }
            }
             new_displayed_transactions.sort{ $0.creation_time > $1.creation_time}
        }
        else if(segmentedControl.selectedSegmentIndex == 2){
            new_displayed_transactions = self.users_previous_transactions;
            new_displayed_transactions.sort{ ($0.end_time as! UInt64) > ($1.end_time as! UInt64)}
        }
        else{
            
        }
        displayed_transactions = new_displayed_transactions;
//        print("displayed_transactions.count:")
//        print(displayed_transactions.count)
        tableView.reloadData();
    }
    
    //    func numberOfSections(in tableView: UITableView) -> Int {
    //        return 2;
    //    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(displayed_transactions.count == 0){
            return 1;
        }
        if(displayed_transactions[section].isActive() || !displayed_transactions[section].hasBeenAccepted()){
            return 1;
        }
        return 2;
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        if(displayed_transactions.count == 0){
            return 1;
        }
        return displayed_transactions.count;
    }
    
    func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
        if(section == 0){
            return 8;
        }
        return 0;
    }
    func tableView(_ tableView: UITableView, heightForFooterInSection section: Int) -> CGFloat {
        return 8;
    }
    
    //whenever tableView reloadsData it rebuilds every cell, pluggin in data to a view from the storyboard, using methods from the cell class either UITableViewCell by default or a custom cell class
    //dequeueReusableCell selects a cell view associated with the tableView in the storyboard
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(displayed_transactions.count == 0){
            let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell", for: indexPath) as! LabelCell
            if(segmentedControl.selectedSegmentIndex == 0){
                cell.setLabel(text: "You Have No Transaction Requests...")
            }
            else if(segmentedControl.selectedSegmentIndex == 1){
                cell.setLabel(text: "You Have No Active Transactions")
            }
            else if(segmentedControl.selectedSegmentIndex == 2){
                cell.setLabel(text: "You Have No Previous Transactions");
            }
            cell.isUserInteractionEnabled = false;
            return cell;
        }
        let transaction = displayed_transactions[indexPath.section]
        if(indexPath.row == 0){
            if(transaction.hasBeenAccepted()){
                let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionCell2", for: indexPath) as! TransactionCell2
                cell.setTransaction(transaction: transaction)
                return cell;
            }
            else{
                if(UserData.get()?.user_id == transaction.buyer_user_id){
                    if(transaction.buy == true){
                        let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionRequestReceivedCell", for: indexPath) as! TransactionRequestReceivedCell
                        cell.setTransaction(transaction: transaction)
                        return cell;
                    }
                    else{
                        let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionRequestSentCell", for: indexPath) as! TransactionRequestSentCell
                        cell.setTransaction(transaction: transaction)
                        return cell;
                    }
                }
                else{
                    if(transaction.buy == true){
                        let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionRequestSentCell", for: indexPath) as! TransactionRequestSentCell
                        cell.setTransaction(transaction: transaction)
                        return cell;
                    }
                    else{
                        let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionRequestReceivedCell", for: indexPath) as! TransactionRequestReceivedCell
                        cell.setTransaction(transaction: transaction)
                        return cell;
                    }
                    
                }
            }

        }
        else if(indexPath.row == 1){
            let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell", for: indexPath) as! LabelCell
            if(transaction.isCompleted()){
                if(transaction.end_time is NSNull){
                    cell.setLabel(text: "Completed On: End Time Not Specfieid");
                }
                else{
                    let end_time = transaction.end_time as! UInt64;
                    cell.setLabel(text: "Completed On: " + end_time.toDateString())
                }
            }
            else if(transaction.isTerminated()){
                if(transaction.end_time is NSNull){
                    cell.setLabel(text: "Terminated On: End Time Not Specfieid");
                }
                else{
                    let end_time = transaction.end_time as! UInt64;
                    if let terminating_user_id = transaction.getTerminatingUserId(){
                        if let terminating_user = DataStore.get().getUserInfo(user_id: terminating_user_id){
                            guard let first_name = terminating_user.first_name else{
                                return cell;
                            }
                            guard let last_name = terminating_user.last_name else{
                                return cell;
                            }
                            let terminating_user_name = first_name + " " + last_name
                            cell.setLabel(text: "Terminated by " +  terminating_user_name + " on: " + end_time.toDateString())
                        }
                    }
                }
            }
            else{
                cell.setLabel(text: "Transaction Is Currently In Progress")
            }
            return cell;
        }
        else{
            return UITableViewCell();
        }
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath as IndexPath, animated: true)
        let transaction = displayed_transactions[indexPath.section];
        if(transaction.hasBeenAccepted()){
            let topViewController = UIApplication.topViewController();
            if !(topViewController is MainController){
                let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
                let controller : TransactionViewController2 = storyBoard.instantiateViewController(withIdentifier: "TransactionViewController2") as! TransactionViewController2
                controller.setTransaction(transaction: transaction);
                topViewController?.show(controller, sender: topViewController);
            }
        }
        
        
    }
    
    func segmentedControlValueChanged(segmentedControl: UISegmentedControl){
        if(segmentedControl.selectedSegmentIndex == 0){
            loadActiveTransactions();
            updateDisplayedTransactions()
            tableView.allowsSelection = false;
            
//            self.tabBarController?.tabBar.items?[1].badgeValue = nil;

        }
        else if(segmentedControl.selectedSegmentIndex == 1){
            loadActiveTransactions();
            updateDisplayedTransactions();
            tableView.allowsSelection = true;

        }
        else if(segmentedControl.selectedSegmentIndex == 2){
            loadPreviousTransactions();
            updateDisplayedTransactions();
            tableView.allowsSelection = false;
        }
    }
    
}
