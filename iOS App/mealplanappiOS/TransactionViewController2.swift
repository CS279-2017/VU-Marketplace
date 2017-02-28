//
//  TransactionViewController2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/5/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionViewController2: UIViewController, UITableViewDelegate, UITableViewDataSource, UITextFieldDelegate, UIGestureRecognizerDelegate{
    
    var transaction: Transaction?
    @IBOutlet weak var tableView: UITableView!
    
    @IBOutlet weak var otherUsersNameLabel: UILabel!
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var backButton: UIButton!
    
    @IBOutlet weak var titleView: UIView!
    
    var keyboardHeight:CGFloat = 0;
    
    var activeField: UITextField?
    
    var keyboardShown = false;
    
    var sendMessage: (() -> Void)?;
    
    var chatBoxTableView: UITableView?

            
    override func viewDidLoad() {
        hideKeyboardWhenTappedAround();
        tableView.delegate = self;
        tableView.dataSource = self;
//        tableView.tableFooterView = UIView();
        
//        tableView.rowHeight = UITableViewAutomaticDimension
//        tableView.estimatedRowHeight = 280
        
        tableView.allowsSelection = false;
        
        tableView.tableFooterView = UIView();
        
        backButton.addTarget(self, action: #selector(backButtonClicked(button:)), for: .touchUpInside)
        
        titleView.backgroundColor = UIColor(white: 0, alpha: 0)
//        if(transaction != nil){titleLabel.text = transaction?.title;}
        titleView.isOpaque = false;
        
//        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWasShown(notification:)), name: .UIKeyboardWillShow, object: nil)
//        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillBeHidden(notification:)), name: .UIKeyboardWillShow, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow(notification:)), name: .UIKeyboardWillShow, object: nil)
        
        if let transaction = transaction{
            DataStore.get().getUser(user_id: transaction.getOtherUserId()!, callback: {_ in 
                DataStore.get().getProfilePicture(user_id: transaction.getOtherUserId()!, callback: {_,_ in
                    self.tableView.reloadData()
                }, error_handler: DataStore.get().error_handler)
            }, error_handler: DataStore.get().error_handler)
        }
        
        func transactionConfirmedListener(data: Any){
            let data = data as! Dictionary<String, Any>
            let user_id = data["user_id"] as! String
            let transaction_id = data["transaction_id"] as! String
            func callback(dictionary: Dictionary<String, Any>){
                let transaction = Transaction(dictionary: dictionary);
                self.setTransaction(transaction: transaction);
                tableView.reloadData();
            }
            DataStore.get().getTransaction(transaction_id: transaction_id, callback: callback, error_handler: DataStore.get().error_handler)
        }
        
        DataStore.get().addListener(listener: transactionConfirmedListener, forEvent: "transaction_confirmed", key: "TransacationViewController2");
        
        func transactionCompletedListener(data: Any){
            print("transactionCompletedListener triggered in TransactionViewController")
            let data = data as! Dictionary<String, Any>
            let transaction_id = data["transaction_id"] as! String
            if(transaction_id == self.transaction?._id){
                self.dismiss(animated: true, completion: nil)
            }
        }
        
        DataStore.get().addListener(listener: transactionCompletedListener, forEvent: "transaction_completed", key: "TransactionViewController2");
        
        func transactionTerminatedListener(data: Any){
            print("transactionTerminatedListener triggered in TransactionViewController")
            let data = data as! Dictionary<String, Any>
            let transaction_id = data["transaction_id"] as! String
            if(transaction_id == self.transaction?._id){
                self.dismiss(animated: true, completion: nil)
            }
        }
        
        DataStore.get().addListener(listener: transactionTerminatedListener, forEvent: "transaction_terminated", key: "TransactionViewController2");


    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(false)
        initReconnectTimer();
    }
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return 5;
    }
    
    
//    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
//        if(section == 0){
//            return "Map"
//        }
//        else if(section == 1){
//           return "Chat"
//        }
//        else{
//            return nil;
//        }
//    }
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        //
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(section == 0){
            return 2;
        }
        return 1;
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        if(indexPath.section == 1){
            //navigation bar = 60
            //ChatBarCell = 40, ButtonCell = 40
            let frame_space = self.view.frame.size.height - 60 - 40 - 40 - 100 - 70;
            return frame_space/3 * 2;
        }
        else if(indexPath.section == 2){
            let frame_space = self.view.frame.size.height - 60 - 40 - 40 - 100 - 70;
            return frame_space/3 * 1;
        }
        else if(indexPath.section == 0){
            if(indexPath.row == 0){
                return 100;
            }
            return 50;
        }
        else{
            return 40;
        }
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(self.transaction != nil){
            if(indexPath.section == 0){
                if(indexPath.row == 0){
                    let cell = tableView.dequeueReusableCell(withIdentifier: "UserCell") as! UserCell;
                    cell.setTransaction(transaction: self.transaction!)
                    return cell;
                }
                let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionStatusCell") as! TransactionStatusCell;
                cell.setTransaction(transaction: self.transaction!)
                return cell;
                
            }
            else if(indexPath.section == 1){
                let cell = tableView.dequeueReusableCell(withIdentifier: "MapCell") as! MapCell;
                cell.setTransaction(transaction: transaction!)
                return cell;
            }
            else if(indexPath.section == 2){
                let cell = tableView.dequeueReusableCell(withIdentifier: "ChatBoxCell") as! ChatBoxCell;
                cell.setTransaction(transaction: transaction!);
                self.chatBoxTableView = cell.tableView
                return cell;
            }
            else if(indexPath.section == 3){
                let cell = tableView.dequeueReusableCell(withIdentifier: "ChatBarCell") as! ChatBarCell;
                cell.setTransaction(transaction: transaction!);
                cell.textField.delegate = self;
                self.sendMessage = cell.sendMessage;
                return cell;
            }
            else if(indexPath.section == 4){
                let cell = tableView.dequeueReusableCell(withIdentifier: "ButtonCell") as! ButtonCell;
                var buttonInfoArray = [ButtonInfo]();
                buttonInfoArray.append(ButtonInfo(title: "Confirm", handler: confirmTransactionButtonClicked, selected: nil));
                buttonInfoArray.append(ButtonInfo(title: "Terminate", handler: terminateTransactionButtonClicked, selected: nil));
                cell.setButtons(buttonInfoArray: buttonInfoArray);
                return cell;
            }
            else{
                return UITableViewCell();
            }
        }
        return UITableViewCell();
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
        
        let alertController = UIAlertController(title: "Are you sure you want to confirm?", message: "Confirming means you've received transaction and have received the item/payment via Venmo from the other user.", preferredStyle: UIAlertControllerStyle.alert)
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
        
        let alertController = UIAlertController(title: "Are you sure you want to terminate this transaction?", message: "Terminating the transaction will end the transaction.", preferredStyle: UIAlertControllerStyle.alert)
        let terminateAction = UIAlertAction(title: "Terminate", style: UIAlertActionStyle.destructive) { (result : UIAlertAction) -> Void in
            terminateTransaction();
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
            
        }
        alertController.addAction(terminateAction)
        alertController.addAction(cancelAction)
        self.present(alertController, animated: true, completion: nil)
    }


    func backButtonClicked(button: UIButton){
        self.dismiss(animated: true, completion: nil)
    }
////
//    func textFieldShouldBeginEditing(_ textField: UITextField) -> Bool {
//        activeField = textField;
//        return true;
//    }
//    
//    func textFieldShouldEndEditing(_ textField: UITextField) -> Bool {
//        activeField = nil;
//        return false;
//
//    }
    func textFieldDidEndEditing(_ textField: UITextField) {
        animateViewMoving(up: false, moveValue: self.keyboardHeight)
        keyboardShown = false;
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        sendMessage!();
        return false;
    }
//
//     Lifting the view up
    func animateViewMoving (up:Bool, moveValue :CGFloat){
        let movementDuration:TimeInterval = 0.3
        let movement:CGFloat = ( up ? -moveValue : moveValue)
        UIView.beginAnimations( "animateView", context: nil)
        UIView.setAnimationBeginsFromCurrentState(true)
        UIView.setAnimationDuration(movementDuration )
        self.view.frame = self.view.frame.offsetBy(dx: 0,  dy: movement)
        UIView.commitAnimations()
    }
    
    func keyboardWillShow(notification: NSNotification) {
        if(keyboardShown == false){
            keyboardShown = true;
            if let keyboardSize = (notification.userInfo?[UIKeyboardFrameBeginUserInfoKey] as? NSValue)?.cgRectValue {
                let keyboardHeight = keyboardSize.height;
                self.keyboardHeight = keyboardHeight;
                print("keyboardHeight: ");
                animateViewMoving(up: true, moveValue: keyboardHeight);
            }
        }
        
    }
    
//    func keyboardWasShown(notification: NSNotification){
//        print("keyboardWasShown");
//        //Need to calculate keyboard exact size due to Apple suggestions
//        var info = notification.userInfo!
//        let keyboardSize = (info[UIKeyboardFrameBeginUserInfoKey] as? NSValue)?.cgRectValue.size
//        let contentInsets : UIEdgeInsets = UIEdgeInsetsMake(0.0, 0.0, keyboardSize!.height, 0.0)
//        
//        self.tableView.contentInset = contentInsets
//        self.tableView.scrollIndicatorInsets = contentInsets
//        
//        var aRect : CGRect = self.view.frame
//        aRect.size.height -= keyboardSize!.height
//        if let activeField = self.activeField {
////            if (!aRect.contains(activeField.frame.origin)){
//                self.tableView.scrollRectToVisible(activeField.frame, animated: true)
////            }
//        }
//    }
//    
    func keyboardWillBeHidden(notification: NSNotification){
        animateViewMoving(up: false, moveValue: self.keyboardHeight)
        keyboardShown = false;


        //Once keyboard disappears, restore original positions
//        var info = notification.userInfo!
//        let keyboardSize = (info[UIKeyboardFrameBeginUserInfoKey] as? NSValue)?.cgRectValue.size
//        let contentInsets : UIEdgeInsets = UIEdgeInsetsMake(0.0, 0.0, -keyboardSize!.height, 0.0)
//        self.tableView.contentInset = contentInsets
//        self.tableView.scrollIndicatorInsets = contentInsets
//        self.view.endEditing(true)
    }
    
    override func hideKeyboardWhenTappedAround() {
        let tap: UITapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(UIViewController.dismissKeyboard))
        tap.delegate = self;
        tap.delaysTouchesEnded = false;
        tap.cancelsTouchesInView = false;
        tap.delaysTouchesBegan = false;
        view.addGestureRecognizer(tap)

    }
    override func dismissKeyboard() {
        view.endEditing(true)
    }
    
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        if(touch.view?.tag == 100){
            return false;
        }
        return true;
    }

}
