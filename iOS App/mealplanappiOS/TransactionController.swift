//
//  TransactionController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/19/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import Foundation
import UIKit

class TransactionController: UIViewController, UITableViewDelegate, UITableViewDataSource{
    
    var users_active_transactions = [Transaction]();
    var displayed_transactions = [Transaction]();
    
    @IBOutlet weak var tableView: UITableView!
    
    @IBOutlet weak var segmentedControl: UISegmentedControl!
    
    override func viewDidLoad() {
        super.viewDidLoad();
        tableView.delegate = self;
        tableView.dataSource = self;
//        tableView.estimatedRowHeight = 44.0
        tableView.rowHeight = UITableViewAutomaticDimension
        
        tableView.tableFooterView = UIView();
        
        segmentedControl.addTarget(self, action: #selector(segmentedControlValueChanged(segmentedControl:)), for: UIControlEvents.valueChanged);
        segmentedControl.isMomentary = false;
        
        segmentedControlValueChanged(segmentedControl: self.segmentedControl);

        
//        func onConnectListener(){
//            print("onConnectListener called!")
//            if (self.isViewLoaded && (self.view.window != nil)) {
//                loadActiveTransactions();
//                self.hideActivityIndicator();
//            }
//        }
        
        DataStore.get().socket.on("connect") {data, ack in
//            onConnectListener();
        }
        
        func transactionRequestMadeListener(data: Any){
            print("transactionRequestMadeListener triggered in TransactionController")
            let data = data as! Dictionary<String, Any>
            let transaction = data["transaction"] as! Dictionary<String, Any>;
            addTransaction(transaction: Transaction(dictionary: transaction)) //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        DataStore.get().addListener(listener: transactionRequestMadeListener, forEvent: "transaction_request_made", key: "TransactionController");
        
        //we only have to be concerned about accepted since transaction gets deleted if declined and the necessary changes are saved to the database
        func transactionRequestAcceptedListener(data: Any){
            print("transactionRequestAcceptedListener triggered in TransactionController")
            let data = data as! Dictionary<String, Any>
            let transaction_id = data["transaction_id"] as! String;
            let user_id = data["user_id"] as! String;
            let transaction = users_active_transactions[users_active_transactions.index(where:  {$0._id == transaction_id})!];
            if(transaction.buyer_user_id == user_id){
                transaction.buyer_accepted_request = true;
            }
            else if(transaction.seller_user_id == user_id){
                transaction.seller_accepted_request = true;
            }
            updateDisplayedTransactions();
            //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        DataStore.get().addListener(listener: transactionRequestAcceptedListener, forEvent: "transaction_request_accepted", key: "TransactionController");
        
        
        func transactionStartedListener(data: Any){
            print("transaction_started handler called");
            let data = data as! Dictionary<String, Any>;
            let transaction_id = data["transaction_id"] as! String;
            startTransaction(transaction_id: transaction_id)
        }
        DataStore.get().addListener(listener: transactionStartedListener, forEvent: "transaction_started", key: "TransactionController");
        
        func transactionRequestDeclinedListener(data: Any){
            print("transaction_declined handler called");
            let data = data as! Dictionary<String, Any>;
            let transaction_id = data["transaction_id"] as! String;
            removeTransaction(transaction_id: transaction_id)
            
        }
        DataStore.get().addListener(listener: transactionRequestDeclinedListener, forEvent: "transaction_request_declined", key: "TransactionController");
        
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
            removeTransaction(transaction_id: transaction_id) //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        
        DataStore.get().addListener(listener: transactionCompletedListener, forEvent: "transaction_completed", key: "TransactionController");
        
        func transactionTerminatedListener(data: Any){
            print("transactionCompletedListener triggered in TransactionController")
            let data = data as! Dictionary<String, Any>;
            let transaction_id = data["transaction_id"] as! String;
            removeTransaction(transaction_id: transaction_id) //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        DataStore.get().addListener(listener: transactionTerminatedListener, forEvent: "transaction_terminated", key: "TransactionController");
        
        func transactionConfirmedListener(data: Any){
            segmentedControlValueChanged(segmentedControl: self.segmentedControl);
        }
        
        DataStore.get().addListener(listener: transactionConfirmedListener, forEvent: "transaction_confirmed", key: "TransacationController");
    }
    
    override func viewWillAppear(_ animated: Bool) {
        if(DataStore.get().socket_connected){
            segmentedControlValueChanged(segmentedControl: self.segmentedControl)
            updateDisplayedTransactions();
        }
        else{
//            self.showActivityIndicator();
        }
    }
    
    private func loadActiveTransactions(){
        print("loadActiveTransactions called");
        if let userData = UserData.get(){
            let user_id = userData.user_id
            let password = userData.password
            func callback(all_active_transactions: [Dictionary<String, Any>]){
                var new_transactions = [Transaction]();
                for dictionary in all_active_transactions{
                    new_transactions.append(Transaction(dictionary: dictionary))
                }
                setTransactions(transactions: new_transactions);
//                self.hideProgressBar();
            }
            if(user_id != nil && password != nil){
//                if(DataStore.get().socket_connected){
//                    self.showProgressBar(msg: "Loading Transactions", true, width: 240)
//                }
                DataStore.get().getUsersActiveTransactions(user_id: user_id!, password: password!, callback: callback, error_handler: self.error_handler)
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
    
    func setTransactions(transactions: [Transaction]){
        self.users_active_transactions = transactions;
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
            let controller : TransactionViewController = storyBoard.instantiateViewController(withIdentifier: "TransactionViewController") as! TransactionViewController
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
//        var new_displayed_transactions = [Transaction]();
        print("updateDisplayedTransactions called!");
        if(segmentedControl.selectedSegmentIndex == 0){
            print("segmentedControl.selectedSegmentIndex == 0");
            displayed_transactions = users_active_transactions;
        }
        else{
            displayed_transactions = [Transaction]();
        }
        print("displayed_transactions.count:")
        print(displayed_transactions.count)
        tableView.reloadData();
    }
    
//    func numberOfSections(in tableView: UITableView) -> Int {
//        return 2;
//    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return displayed_transactions.count;
    }
    
    //whenever tableView reloadsData it rebuilds every cell, pluggin in data to a view from the storyboard, using methods from the cell class either UITableViewCell by default or a custom cell class
    //dequeueReusableCell selects a cell view associated with the tableView in the storyboard
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let transaction = displayed_transactions[indexPath.row];
        if(transaction.hasBeenAccepted()){
            let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionCell", for: indexPath) as! TransactionCell
            cell.setTransaction(transaction: transaction)
            return cell;
        }
        else{
            let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionRequestCell", for: indexPath) as! TransactionRequestCell
            cell.setTransaction(transaction: transaction)
            return cell;
        }
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath as IndexPath, animated: true)
        let transaction = displayed_transactions[indexPath.row];
        if(transaction.hasBeenAccepted()){
            let topViewController = UIApplication.topViewController();
            if !(topViewController is MainController){
                let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
                let controller : TransactionViewController = storyBoard.instantiateViewController(withIdentifier: "TransactionViewController") as! TransactionViewController
                controller.setTransaction(transaction: transaction);
                topViewController?.show(controller, sender: topViewController);
            }
        }

        
    }
    
    func segmentedControlValueChanged(segmentedControl: UISegmentedControl){
        updateDisplayedTransactions();
    }
    
    func error_handler(error: String){
        let alertController = UIAlertController(title: "Error", message: error, preferredStyle: UIAlertControllerStyle.alert)
        let okAction = UIAlertAction(title: "Ok", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
        }
        alertController.addAction(okAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
}
