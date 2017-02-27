//
//  TransactionViewController3.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class ListingViewController2: BaseController, UITableViewDelegate, UITableViewDataSource{
    
    @IBOutlet weak var backButton: UIButton!
    @IBOutlet weak var tableView: UITableView!
    
    @IBOutlet weak var headerTableView: UITableView!
    var listing: Listing?
    var users_dictionary = [String : User]();
    
    var displayed_conversations = [Conversation]();
    
    var refreshControl = UIRefreshControl();
    
    var bookCoverImageDictionary = [String: UIImage]();
    
    override func viewDidLoad() {
        backButton.addTarget(self, action: #selector(backButtonClicked), for: .touchUpInside)
        
        headerTableView.delegate = self;
        headerTableView.dataSource = self;
        headerTableView.tableFooterView = UIView();
//        headerTableView.rowHeight = 100;
//        headerTableView.estimatedRowHeight = 100
        
        tableView.delegate = self;
        tableView.dataSource = self;
        tableView.tableFooterView = UIView();
        tableView.rowHeight = UITableViewAutomaticDimension
        tableView.estimatedRowHeight = 100
        
        if #available(iOS 10.0, *) {
            tableView.refreshControl = refreshControl
        } else {
            tableView.addSubview(refreshControl);
        };
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: UIControlEvents.valueChanged)
    }
    
    override func viewWillAppear(_ animated: Bool) {
        refreshControl.beginRefreshing();
        handleRefresh();
    }
    
    func set(listing: Listing){
        self.listing = listing;
//        if let book = listing.book{
//            guard let url = book.image_url else { return; }
//            self.bookCoverImageDictionary[book.isbn13!] = UIApplication.shared.downloadImageSynchronously(url: url)
//        }
    }
    
    func backButtonClicked(){
        self.dismiss(animated: true, completion: nil)
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if(tableView == headerTableView){
            if(indexPath.row == 0){
                tableView.deselectRow(at: indexPath, animated: true);
                guard let selectedListing = self.listing else { DataStore.get().error_handler(error: "Invalid Listing"); return; }
                segueToListingDetailController(selectedListing: selectedListing)
            }
        }
        else if(tableView == self.tableView){
            if(displayed_conversations.count > 0){
                tableView.deselectRow(at: indexPath, animated: true);
                let conversation = displayed_conversations[indexPath.row];
                let user = users_dictionary[conversation.other_user_id]
                guard let selectedListing = self.listing else { DataStore.get().error_handler(error: "Invalid Listing"); return;}
                segueToChatViewController(selectedListing: selectedListing, selectedUserId: conversation.other_user_id)
            }
        }
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(tableView == headerTableView){
            if(indexPath.row == 0){
                let cell = tableView.dequeueReusableCell(withIdentifier: "BookCell") as! BookCell
                cell.set(listing: self.listing!, bookCoverImageDictionary: self.bookCoverImageDictionary)
                cell.isUserInteractionEnabled = true;
                
                return cell;
            }
            if(indexPath.row == 1){
                let cell = tableView.dequeueReusableCell(withIdentifier: "MarkAsSoldButtonCell") as! MarkAsSoldButtonCell
                cell.selectionStyle = .none;
                cell.set(listing: self.listing!)
                return cell;
            }
            else{
                return UITableViewCell();
            }
        }
        else if(tableView == self.tableView){
            guard let listing = self.listing else { return UITableViewCell();}
            if displayed_conversations.count == 0{
                let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell") as! LabelCell
                cell.setLabel(text: "There Are No Buyers Inquiring About This Listings");
                cell.selectionStyle = .none;
                return cell;
            }
            else{
                let cell = tableView.dequeueReusableCell(withIdentifier: "ConversationCell") as! ConversationCell
                let message = Message(text: "Placeholder message", to_user_id: (UserData.get()?.user_id)!, time_sent: UInt64(Date().timeIntervalSince1970) * 1000)
                let conversation = displayed_conversations[indexPath.row];
                let user = self.users_dictionary[conversation.other_user_id]
                cell.set(conversation: conversation , listing: listing, user: user!)
                return cell;
            }
        }
        return UITableViewCell();
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(tableView == headerTableView){
            return 2;
        }
        if(tableView == self.tableView){
            if(displayed_conversations.count == 0){
                return 1;
            }
            return displayed_conversations.count;
        }
        return 0;
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        if tableView == self.headerTableView{
            if(indexPath.row == 0){
                return 80;
            }
        }
        return UITableViewAutomaticDimension;
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        if(tableView == self.headerTableView){
            return "Your Listing:"
        }
        if(tableView == self.tableView){
            return "Buyers Interested In This Listing:"
        }
        return nil;
    }
    
    func updateDisplayedConversations(){
        tableView.reloadData();
    }
    
    func handleRefresh(){
        loadConversationsForListing(done: {
            self.refreshControl.endRefreshing();
        });
    }
    
    func loadConversationsForListing(done: @escaping (()->Void)){
        let listing = self.listing!
        guard let buyer_ids = listing.buyer_user_ids else { done(); return; }
        guard let listing_id = self.listing?._id else { done(); return; }
        DataStore.get().getConversations(listing_id: listing_id, callback: {conversations in
            self.displayed_conversations = conversations;
            guard let my_user_id = UserData.get()?.user_id else { done();return;}
            var other_user_ids = [String]();
            for conversation in conversations{
                other_user_ids.append(conversation.other_user_id);
            }
            DataStore.get().getUsers(user_ids: other_user_ids, callback: { users in
                for user in users{
                    self.users_dictionary[user._id!] = user;
                }
                self.updateDisplayedConversations();
                done();
            }, error_handler: {error in
                DataStore.get().error_handler(error: error);
                done();
            })
            
            
        }, error_handler: { error in
            DataStore.get().error_handler(error: error)
            done();
        })
    }
    
    func loadUsersForConversations(done: @escaping (()->Void)){
        
    }
    
    //if user clicks the Book Cell in headerTableView
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
    
    //if user clicks on a ChatCell
//    func segueToChatViewController(selectedUser: User){
//        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//        let controller : ChatViewController = storyBoard.instantiateViewController(withIdentifier: "ChatViewController") as! ChatViewController
//        controller.set(listing: self.listing!, user: selectedUser);
//        self.present(controller, animated: true, completion: nil);
//    }
    
}
