//
//  ListingViewController2.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/15/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class ListingDetailController: BaseController, UITableViewDelegate, UITableViewDataSource{
    
    @IBOutlet weak var hoverButtonStackView: UIStackView!
    @IBOutlet weak var buyButton: UIButton!
    @IBOutlet weak var chatButton: UIButton!
    
    @IBOutlet weak var backButton: UIButton!

    @IBOutlet weak var editButton: UIButton!
    @IBOutlet weak var tableView: UITableView!
    
    var listing: Listing?
    
    var user: User?
    var book: Book?
    
    var bookCoverImageDictionary = [String: UIImage]();
    
    override func viewDidLoad() {
        //
        backButton.addTarget(self, action: #selector(backButtonClicked), for: .touchUpInside)
        editButton.addTarget(self, action: #selector(editButtonClicked(button:)), for: .touchUpInside)
        
        chatButton.addTarget(self, action: #selector(chatButtonClicked(button:)), for: .touchUpInside)
        
        buyButton.addTarget(self, action: #selector(buyButtonClicked(button:)), for: .touchUpInside)
        
        tableView.delegate = self;
        tableView.dataSource = self;
        tableView.tableFooterView = UIView();
        
        tableView.rowHeight = UITableViewAutomaticDimension
        tableView.estimatedRowHeight = 280
        
//        tableView.allowsSelection = false;
        
        if(self.listing == nil || UserData.get()?.user_id != self.listing?.user_id){
            editButton.isHidden = true;
        }
        else{
            editButton.isHidden = false;
        }
        
        self.view.bringSubview(toFront: hoverButtonStackView);
//        func listingRemovedListener(data: Any){
//            print("listing_removed handler called");
//            let data = data as! Dictionary<String, Any>;
//            let listing_id = data["listing_id"] as! String;
//            if(listing_id == self.listing?._id){
//                self.dismiss(animated: true, completion: nil);
//            }
//        }
//        
//        DataStore.get().addListener(listener: listingRemovedListener, forEvent: "listing_removed", key: "ListingViewController");
        
//        func listingUpdatedListener(data: Any){
//            print("listing_updated handler called");
//            let data = data as! Dictionary<String, Any>
//            let updated_dictionary = data["listing"] as! Dictionary<String, Any>;
//            let updated_listing = Listing(dictionary: updated_dictionary);
//            if(self.listing != nil && updated_listing._id == self.listing?._id){
//                self.listing?.update(listing: updated_listing);
//                let indexPath1 = NSIndexPath(row: 1, section: 0)
//                let indexPath2 = NSIndexPath(row: 0, section: 0)
//                self.tableView.reloadRows(at: [indexPath1 as IndexPath, indexPath2 as IndexPath], with: UITableViewRowAnimation.automatic)
////                self.titleNavigationItem.title = self.listing?.title;
//            }
//        }
//        DataStore.get().addListener(listener: listingUpdatedListener, forEvent: "listing_updated", key: "ListingViewController");
    }
    
    override func viewWillAppear(_ animated: Bool) {
        guard let listing = self.listing else { return; }
        if(listing.user_id == UserData.get()?.user_id!){
            self.hoverButtonStackView.isHidden = true;
        }
    }
    
    func set(listing: Listing, user: User){
        self.listing = listing;
        self.book = listing.book!;
//        if let url = book?.image_url{
//            self.bookCoverImageDictionary[(book?.isbn13!)!] = UIApplication.shared.downloadImageSynchronously(url: url);
//        }
        self.user = user;
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        //UserCell3
        if(indexPath.section == 1){
            tableView.deselectRow(at: indexPath, animated: true);
            segueToProfileViewController(selectedUser: self.user!)
        }
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(self.listing != nil){
            if(indexPath.section == 0){
                let cell = tableView.dequeueReusableCell(withIdentifier: "BookCell") as! BookCell;
                cell.set(listing: self.listing!, bookCoverImageDictionary: self.bookCoverImageDictionary)
                cell.selectionStyle = .none;
//                cell.isUserInteractionEnabled = false;
                return cell;
            }
            else if(indexPath.section == 1){
                let cell = tableView.dequeueReusableCell(withIdentifier: "UserCell3") as! UserCell3;
                cell.set(user: self.user!);
                return cell;
            }
            else if(indexPath.section == 2){
               let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell") as! LabelCell;
                cell.setLabel(text: (listing?.description)!)
                cell.selectionStyle = .none;
                return cell;
            }
        }
        return UITableViewCell();
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        if(section == 0){
            return "Book Details"
        }
        if(section == 1){
            return "Seller"
        }
        if(section == 2){
            return "Description"
        }
        return nil;
    }
    func numberOfSections(in tableView: UITableView) -> Int {
        return 3;
    }
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return 1;
    }
    
    func backButtonClicked(){
        self.dismiss(animated: true, completion: {
            if let topViewController =  UIApplication.shared.topViewController(){
                let listingViewController = topViewController as? ListingViewController2;
                listingViewController?.listing = self.listing;
                listingViewController?.headerTableView.reloadData();
                listingViewController?.updateDisplayedConversations();
            }
        });
    }
    
//    func removeListingButtonClicked(button: UIButton){
//        let user_id = UserData.get()?.user_id;
//        let password = UserData.get()?.password;
//        let listing_id = self.listing?._id;
//        
//        func callback(){
//            self.dismiss(animated: true, completion: nil);
//        }
//        
//        func error_handler(error:String){
//            print(error);
//        }
//        
//        let alertController = UIAlertController(title: "Are you sure you want to remove this listing?", message: "", preferredStyle: UIAlertControllerStyle.alert)
//        let terminateAction = UIAlertAction(title: "Remove Listing", style: UIAlertActionStyle.destructive) { (result : UIAlertAction) -> Void in
//            DataStore.get().removeListing(user_id: user_id!, password: password!, listing_id: listing_id!, callback: callback, error_handler: error_handler);
//        }
//        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
//            
//        }
//        alertController.addAction(terminateAction)
//        alertController.addAction(cancelAction)
//        self.present(alertController, animated: true, completion: nil)
//        
//    }
    
//    func makeTransactionRequestButtonClicked(button: UIButton){
//        let user_id = UserData.get()?.user_id;
//        let password = UserData.get()?.password;
//        let listing_id = self.listing?._id;
//        
//        func callback(){
//            self.dismiss(animated: true, completion: nil);
//        }
//        let alertController = UIAlertController(title: "Transaction Request", message: "Offer A New Price Or Keep The Listing Price", preferredStyle: UIAlertControllerStyle.alert)
//        let confirmAction = UIAlertAction(title: "Request Transaction", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
//            let textField = alertController.textFields![0]
//            if let offer = textField.text?.toPrice(){
//                DataStore.get().makeTransactionRequest(user_id: user_id!, password: password!, listing_id: listing_id!, callback: callback, error_handler: DataStore.get().error_handler, offer: offer);
//            }
//            else{
//                DataStore.get().error_handler(error: "Must enter a valid price amount!");
//            }
//        }
//        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
//            
//        }
//        alertController.addTextField { (textField) in
//            textField.text = self.listing?.price.toTwoDecimalPlaces();
//            textField.keyboardType = .decimalPad;
//        }
//        alertController.addAction(confirmAction)
//        alertController.addAction(cancelAction)
//        self.present(alertController, animated: true, completion: nil)
//        
//    }
    
    func editButtonClicked(button: UIButton){
        if let listing = self.listing{
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let controller = storyboard.instantiateViewController(withIdentifier: "MakeListingController3") as! MakeListingController3
            controller.set(listing: listing)
            self.present(controller, animated: true, completion: nil)
        }
    }
    
    func chatButtonClicked(button: UIButton){
        print("chatButtonClicked");
        guard let selectedListing = self.listing else { DataStore.get().error_handler(error: "Invalid Listing"); return;}
        segueToChatViewController(selectedListing: selectedListing, selectedUserId: selectedListing.user_id)
//        segueToChatViewController();
    }
    
    func buyButtonClicked(button: UIButton){
        let alertController = UIAlertController(title: "You Cannot Purchase Through the App Yet", message: "Instead Tap The Users Venmo Id and Hold to Copy, Then Pay Through Venmo", preferredStyle: UIAlertControllerStyle.alert)
        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
            
        }
        alertController.addAction(cancelAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
//    func segueToChatViewController(){
//        let selectedListing = self.listing!
//        DataStore.get().getUser(user_id: selectedListing.user_id, callback: {user in
//            let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//            let controller : ChatViewController = storyBoard.instantiateViewController(withIdentifier: "ChatViewController") as! ChatViewController
//            controller.set(listing: selectedListing, user: user);
//            self.present(controller, animated: true, completion: nil);
//        }, error_handler: DataStore.get().error_handler);
//    }
    
//    func segueToProfileViewController(selectedUser: User){
//        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//        let controller : ProfileViewController = storyBoard.instantiateViewController(withIdentifier: "ProfileViewController") as! ProfileViewController
//        
//        controller.set(user: selectedUser);
//        self.present(controller, animated: true, completion: nil);
//        //        DataStore.get().getUser(user_id: selectedListing.user_id, callback: { user in
//        //            controller.set(listing: selectedListing, user: user);
//        //            self.present(controller, animated: true, completion: nil);
//        //        }, error_handler: DataStore.get().error_handler)
//    }

    
}
