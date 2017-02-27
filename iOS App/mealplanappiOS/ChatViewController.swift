//
//  ChatViewController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class ChatViewController: BaseController, UITableViewDelegate, UITableViewDataSource{
    
   @IBOutlet weak var navigationBarTitle: UINavigationItem!
    
    @IBOutlet weak var chatBarTextField: UITextField!
    @IBOutlet weak var sendMessageButton: UIButton!
    @IBOutlet weak var sendMessageActivityIndicator: UIActivityIndicatorView!
    
    @IBOutlet weak var headerTableView: UITableView!
    @IBOutlet weak var backButton: UIButton!
    
    @IBOutlet weak var chatTableView: UITableView!
    
    @IBOutlet weak var chatBarBottomConstraint: NSLayoutConstraint!
    
    var chatBarBottomConstraintInitialValue: CGFloat?
    
    var listing: Listing?
    var user: User?
    
    var bookCoverImageDictionary = [String: UIImage]();
    
    
    
    var conversation:Conversation?
    var displayed_messages = [Message]();
    
     var refreshControl = UIRefreshControl();
    
    override func viewDidLoad() {
        headerTableView.delegate = self;
        headerTableView.dataSource = self;
        headerTableView.tableFooterView = UIView();
        headerTableView.rowHeight = UITableViewAutomaticDimension;
        headerTableView.estimatedRowHeight = 80;
        
        headerTableView.isScrollEnabled = false;
//        headerTableView.keyboardDismissMode = .onDrag
        
        chatTableView.dataSource = self;
        chatTableView.delegate = self;
        chatTableView.tableFooterView = UIView();
        chatTableView.rowHeight = UITableViewAutomaticDimension;
        chatTableView.estimatedRowHeight = 80;
        chatTableView.keyboardDismissMode = .onDrag
        chatTableView.allowsSelection = false;

        
        if #available(iOS 10.0, *) {
            chatTableView.refreshControl = refreshControl
        } else {
            chatTableView.addSubview(refreshControl);
        };
        
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: UIControlEvents.valueChanged)
        
        sendMessageButton.addTarget(self, action: #selector(sendMessage(button:)), for: .touchUpInside)
        sendMessageButton.isHidden = false;
        sendMessageActivityIndicator.isHidden = true;
        
        backButton.addTarget(self, action: #selector(backButtonClicked), for: .touchUpInside)
        
        self.chatBarBottomConstraintInitialValue = chatBarBottomConstraint.constant
        
        if  let user = self.user{
            if let first_name = user.first_name{
                if let last_name = user.last_name{
                    navigationBarTitle.title = first_name + " " + last_name;
                }
            }

        }
        
        //3
        enableKeyboardHideOnTap()
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow(notification:)), name: NSNotification.Name.UIKeyboardWillShow, object: nil) // See 4.1
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide(notification:)), name: NSNotification.Name.UIKeyboardWillHide, object: nil) //See 4.2


        
    }
    
    override func viewWillAppear(_ animated: Bool) {
        chatTableView.tableViewScrollToBottom(animated: false);
        refreshControl.beginRefreshing();
        handleRefresh();
    }
    
    func set(listing: Listing, user: User){
        self.listing = listing;
//        if let book = listing.book{
//            guard let url = book.image_url else { return; }
//            self.bookCoverImageDictionary[book.isbn13!] = UIApplication.shared.downloadImageSynchronously(url: url)
//        }
        self.user = user;
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        if(tableView == headerTableView){
            return 140;
        }
        else{
            return UITableViewAutomaticDimension;
        }
    }
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if(tableView == headerTableView){
            tableView.deselectRow(at: indexPath, animated: true);
            guard let selectedListing = self.listing else { DataStore.get().error_handler(error: "Invalid Listing"); return; }
            segueToListingDetailController(selectedListing: selectedListing)
        }
    }
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(tableView == headerTableView){
            return 1;
        }
        if(tableView == chatTableView){
            if(displayed_messages.count == 0){
                return 1;
            }
            return displayed_messages.count;

        }
        return 0;
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(tableView == headerTableView){
            let cell = tableView.dequeueReusableCell(withIdentifier: "BookCell") as! BookCell;
            cell.set(listing: self.listing!, bookCoverImageDictionary: self.bookCoverImageDictionary)
            return cell;
        }
        if(tableView == chatTableView){
            if(displayed_messages.count == 0){
                let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell") as! LabelCell
                cell.setLabel(text: "Send A Message! Start The Conversation!")
                cell.isUserInteractionEnabled = false;
                return cell;
            }
            else{
                let cell = tableView.dequeueReusableCell(withIdentifier: "MessageCell") as! MessageCell;
                guard let user_id = UserData.get()?.user_id else {
                    DataStore.get().error_handler(error: "Your User Id is Invalid");
                    cell.selectionStyle = .none;
                    return cell;
                }
                guard let other_user = self.user else { DataStore.get().error_handler(error: "Other User is Invalid");
                    return cell;
                }
                let message = displayed_messages[indexPath.row];
                if(message.from_user_id == user_id){
                    cell.set(message: message, profile_picture: UserData.get()?.profile_picture)
                }
                else{
                    cell.set(message: message, profile_picture: other_user.profile_picture)
                }
                return cell;
            }
        }
        return UITableViewCell();
    }
    
    func handleRefresh(){
        loadMessages(done: {self.refreshControl.endRefreshing()})
    }
    
    private func loadMessages(done: @escaping (()->Void)){
        if(DataStore.get().socket_connected){
            guard let listing = self.listing else {DataStore.get().error_handler(error: "invalid listing"); return;}
            if let user_id = self.user?._id{
                DataStore.get().getConversation(other_user_id: self.user!._id!, listing_id: listing._id, callback: { conversation in
                    self.conversation = conversation;
                    self.displayed_messages = conversation.messages
                    self.updateDisplayedMessages();
                    done();
                }, error_handler: { error in
                    DataStore.get().error_handler(error: error);
                    done();
                })
            }
            else{
                DataStore.get().error_handler(error: "Invalid user");
                done();
            }
        }
        else{
            DataStore.get().error_handler(error: "Not connected to server");
            done();
        }
    }
    
    func updateDisplayedMessages(){
        chatTableView.reloadData();
    }
    
    func sendMessage(button:UIButton){
        if let text = chatBarTextField.text{
            if(text != ""){
                if(DataStore.get().socket_connected){
                    guard let listing = self.listing else {DataStore.get().error_handler(error: "invalid listing"); return;}
                    if let user_id = user?._id{
                        toggleSendMessageButton();
                        DataStore.get().sendMessage(message_text: chatBarTextField.text!, to_user_id: user_id, listing_id: listing._id, callback: { message in
                            self.toggleSendMessageButton();
                            self.chatBarTextField.text = "";
                            self.displayed_messages.append(message)
                            self.updateDisplayedMessages();
                            self.chatTableView.tableViewScrollToBottom(animated: true)
                        }, error_handler: {error in
                            self.toggleSendMessageButton();
                            DataStore.get().error_handler(error: error);
                        })
                    }
                }
            }
        }
    }
    func backButtonClicked(){
        self.dismiss(animated: false, completion: nil)
    }
    
    func toggleSendMessageButton(){
        if(sendMessageActivityIndicator.isHidden){
            sendMessageActivityIndicator.startAnimating();
            sendMessageActivityIndicator.isHidden = false;
            sendMessageButton.isHidden = true;
        }
        else{
            sendMessageActivityIndicator.stopAnimating();
            sendMessageActivityIndicator.isHidden = true;
            sendMessageButton.isHidden = false;
        }
    }
//    func segueToListingDetailController(){
//        guard let selectedListing = self.listing else { DataStore.get().error_handler(error: "Invalid Listing")
//            return; }
//        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//        let controller : ListingDetailController = storyBoard.instantiateViewController(withIdentifier: "ListingDetailController") as! ListingDetailController
//        DataStore.get().getUser(user_id: selectedListing.user_id, callback: { user in
//            controller.set(listing: selectedListing, user: user);
//            self.present(controller, animated: true, completion: nil);
//        }, error_handler: DataStore.get().error_handler)
//    }
    
    
    // 3
    // Add a gesture on the view controller to close keyboard when tapped
    func enableKeyboardHideOnTap(){
        let tap: UITapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(hideKeyboard))
        tap.cancelsTouchesInView = false;
        chatTableView.addGestureRecognizer(tap);
//        self.chatTableView.view.addGestureRecognizer(tap)
    }
    
//    //3.1
    func hideKeyboard() {
        self.view.endEditing(true)
    }
    
    //4.1
    func keyboardWillShow(notification: NSNotification) {
        
        let info = notification.userInfo!
        
        let keyboardFrame: CGRect = (info[UIKeyboardFrameEndUserInfoKey] as! NSValue).cgRectValue
        
        let duration = notification.userInfo![UIKeyboardAnimationDurationUserInfoKey] as! Double
        
        chatTableView.tableViewScrollToBottom(animated: false)
        UIView.animate(withDuration: duration) { () -> Void in
            
            self.chatBarBottomConstraint.constant = keyboardFrame.size.height + 5
            
            self.view.layoutIfNeeded()
            
        }
        
    }
    
    //4.2
    func keyboardWillHide(notification: NSNotification) {
        
        let duration = notification.userInfo![UIKeyboardAnimationDurationUserInfoKey] as! Double
        
        UIView.animate(withDuration: duration) { () -> Void in
            
            self.chatBarBottomConstraint.constant = self.chatBarBottomConstraintInitialValue!
            self.view.layoutIfNeeded()
            
        }
        
    }
}
