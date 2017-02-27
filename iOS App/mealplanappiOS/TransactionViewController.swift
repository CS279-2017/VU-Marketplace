//
//  TransactionViewController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/19/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit
import MapKit

class TransactionViewController: UIViewController, UITableViewDelegate, UITableViewDataSource, MKMapViewDelegate, UITextFieldDelegate, CLLocationManagerDelegate{
    
    var transaction: Transaction?
    
    var thisUsersAnnotation = MKPointAnnotation();
    var otherUsersAnnotation = MKPointAnnotation();
    var thisUsersAnnotationAdded = false;
    var otherUsersAnnotationAdded = false;
    
    @IBOutlet weak var backButton: UIButton!
    
    @IBOutlet weak var titleNavigationItem: UINavigationItem!
    
    @IBOutlet weak var confirmTerminateNavigationBar: UINavigationBar!
    @IBOutlet weak var confirmTransactionButton: UIButton!
    
    @IBOutlet weak var terminateTransactionButton: UIButton!
    
    @IBOutlet weak var mapView: MKMapView!
    
    @IBOutlet weak var tableView: UITableView!
    
    @IBOutlet weak var chatMessageTextField: UITextField!
    @IBOutlet weak var chatBarView: UIStackView!
    @IBOutlet weak var sendMessageButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad();
        
        tableView.delegate = self;
        tableView.dataSource = self;
        tableView.tableFooterView = UIView();
        mapView.delegate = self;
        
        sendMessageButton.addTarget(self, action: #selector(sendMessageButtonClicked(button:)), for: .touchUpInside);
        
        if transaction != nil{
            self.titleNavigationItem.title = transaction?.title;
        }

        
//        func chatMessageSentListener(data: Any){
//            print("chatMessageSentListener triggered in TransactionViewController")
//            let data = data as! Dictionary<String, Any>
//            let transaction_id = data["transaction_id"] as! String
//            let message = data["message"] as! Dictionary<String, Any>;
//            if(self.transaction?._id == transaction_id){
//                self.transaction?.sendChatMessage(message: Message(dictionary:message))
//            }
//            tableView.reloadData();
//        }
//        DataStore.get().addListener(listener: chatMessageSentListener, forEvent: "chat_message_sent", key: "TransactionViewController");
        
        func userLocationUpdatedListener(data: Any){
            print("userLocationUpdatedListener triggered in TransactionViewController")
            let data = data as! Dictionary<String, Any>
            let user_id = data["user_id"] as! String
            let transaction_id = data["transaction_id"] as! String
            let updated_location = data["updated_location"] as! Dictionary<String, Any>;
            updateUserLocation(user_id: user_id, transaction_id: transaction_id, updated_location: Location(dictionary: updated_location))
        }
        
        DataStore.get().addListener(listener: userLocationUpdatedListener, forEvent: "user_location_updated", key: "TransactionViewController");
        
        func transactionCompletedListener(data: Any){
            print("transactionCompletedListener triggered in TransactionViewController")
            let data = data as! Dictionary<String, Any>
            let transaction_id = data["transaction_id"] as! String
            if(transaction_id == self.transaction?._id){
                self.dismiss(animated: true, completion: nil)
            }
        }
        
        DataStore.get().addListener(listener: transactionCompletedListener, forEvent: "transaction_completed", key: "TransactionViewController");
        
        func transactionTerminatedListener(data: Any){
            print("transactionTerminatedListener triggered in TransactionViewController")
            let data = data as! Dictionary<String, Any>
            let transaction_id = data["transaction_id"] as! String
            if(transaction_id == self.transaction?._id){
                self.dismiss(animated: true, completion: nil)
            }
        }
        
        DataStore.get().addListener(listener: transactionTerminatedListener, forEvent: "transaction_terminated", key: "TransactionViewController");
        
        confirmTransactionButton.addTarget(self, action: #selector(confirmTransactionButtonClicked(button:)), for: .touchUpInside)
        terminateTransactionButton.addTarget(self, action: #selector(terminateTransactionButtonClicked(button:)), for: .touchUpInside)
        
        backButton.addTarget(self, action: #selector(backButtonClicked(button:)), for: .touchUpInside)
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        //implement later
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(transaction != nil){
            return transaction!.conversation.getNumberOfMessages();
        }
        return 0;
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "MessageCell", for: indexPath) as! MessageCell
        cell.setMessage(message: transaction!.conversation.get(index: indexPath.row)!)
        return cell;
    }
    
    func mapView(_ mapView: MKMapView, regionWillChangeAnimated animated: Bool) {
        confirmTerminateNavigationBar.isHidden = true;
        tableView.isHidden = true;
        chatBarView.isHidden = true;
    }
    
    func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
        confirmTerminateNavigationBar.isHidden = false;
        tableView.isHidden = false;
        chatBarView.isHidden = false;
    }
    
    
    func backButtonClicked(button: UIButton){
        self.dismiss(animated: true, completion: nil)
    }
    
    func confirmTransactionButtonClicked(button: UIButton){
        func confirmTransaction(){
            let user_id = UserData.get()?.user_id;
            let password = UserData.get()?.password;
            let transaction_id = transaction?._id;
            func callback(){
                print("confirmTransaction successful!");
            }
            func error_handler(error:String){
                print(error);
            }
            DataStore.get().confirmTransaction(user_id: user_id!, password: password!, transaction_id: transaction_id!, callback: callback, error_handler: error_handler)
        }
        
        let alertController = UIAlertController(title: "Are you sure you want to confirm?", message: "Only confirm a transaction once you've met up with the other person and have already received the item in the transaction.", preferredStyle: UIAlertControllerStyle.alert)
        let confirmAction = UIAlertAction(title: "Confirm", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
            confirmTransaction();
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
            
        }
        alertController.addAction(confirmAction)
        alertController.addAction(cancelAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
    func terminateTransactionButtonClicked(button: UIButton){
        func terminateTransaction(){
            let user_id = UserData.get()?.user_id;
            let password = UserData.get()?.password;
            let transaction_id = transaction?._id;
            func callback(){
                print("terminateTransaction successful!");
            }
            func error_handler(error:String){
                print(error);
            }
            DataStore.get().terminateTransaction(user_id: user_id!, password: password!, transaction_id: transaction_id!, callback: callback, error_handler: error_handler)
        }
        
        let alertController = UIAlertController(title: "Are you want to terminate this transaction?", message: "Terminating the transaction will end the transaction, only do this if no transaction took place.", preferredStyle: UIAlertControllerStyle.alert)
        let terminateAction = UIAlertAction(title: "Terminate", style: UIAlertActionStyle.destructive) { (result : UIAlertAction) -> Void in
            terminateTransaction();
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
            
        }
        alertController.addAction(terminateAction)
        alertController.addAction(cancelAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
    func sendMessageButtonClicked(button: UIButton){
        let user_id = UserData.get()?.user_id;
        let password = UserData.get()?.password;
        let transaction_id = transaction?._id;
        let message_text = self.chatMessageTextField.text!
        func callback(){
            self.chatMessageTextField.text = "";
            print("sendChatMessage successful!");
        }
        func error_handler(error:String){
            print(error);
        }
        DataStore.get().sendChatMessage(user_id: user_id!, password: password!, transaction_id: transaction_id!, message_text: message_text, callback: callback, error_handler: error_handler)
    }
    
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
    }
    
    func sendChatMessage(message: Message){
        transaction?.sendChatMessage(message: message);
    }
    
    func updateUserLocation(user_id: String, transaction_id: String, updated_location: Location){
       //update the location of the pin representing the user on the map
//        if(self.transaction?._id == transaction_id){
            if(UserData.get()?.user_id == user_id){
                thisUsersAnnotation.coordinate = updated_location.coordinates();
                if(!thisUsersAnnotationAdded){
                    mapView.addAnnotation(otherUsersAnnotation)
                    thisUsersAnnotationAdded = true;
                    let region = MKCoordinateRegion(center: (UserData.get()?.location?.coordinates())!, span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01))
                    self.mapView.setRegion(region, animated: true)
                }
            }
//        }
        if(UserData.get()?.location != nil){
            //TODO: replace this wish a push/subscriber model for location updates on the client side
            otherUsersAnnotation.coordinate = (UserData.get()?.location!.coordinates())!;
            if(!otherUsersAnnotationAdded){
                mapView.addAnnotation(otherUsersAnnotation)
                otherUsersAnnotationAdded = true;
            }
        }
    }
    
//    func textFieldDidBeginEditing(_ textField: UITextField) {
//        tableView.isHidden = false;
//    }
    
    
}
