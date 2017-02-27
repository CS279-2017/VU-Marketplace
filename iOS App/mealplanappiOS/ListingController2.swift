//
//  ListingController3.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class ListingController2: BaseController, UITableViewDelegate, UITableViewDataSource{
    @IBOutlet weak var tableView: UITableView!
    @IBOutlet weak var segmentedControl: UISegmentedControl!
    
    var refreshControl = UIRefreshControl();
    
    
    var displayed_listings = [Listing]();
    var all_users_listings = [Listing]();
    
    var bookCoverImageDictionary = [String: UIImage]();
    
    override func viewDidLoad() {
        tableView.delegate = self;
        tableView.dataSource = self;
        tableView.estimatedRowHeight = 150
        tableView.rowHeight = UITableViewAutomaticDimension
        
        tableView.tableHeaderView = UIView();
        tableView.tableFooterView = UIView();
        
        self.segmentedControl.addTarget(self, action: #selector(segmentedControlValueChanged(segmentedControl:)), for: UIControlEvents.valueChanged);
        segmentedControl.isMomentary = false;
        
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
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        //Selling
        if(segmentedControl.selectedSegmentIndex == 0){
            tableView.deselectRow(at: indexPath, animated: true);
           segueToListingViewController(selectedListing: displayed_listings[indexPath.row])
        }
        if(segmentedControl.selectedSegmentIndex == 1){
            tableView.deselectRow(at: indexPath, animated: true);
            showActionSheet(selectedListing: displayed_listings[indexPath.row]);
        }
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(displayed_listings.count == 0){
            let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell") as! LabelCell
            cell.isUserInteractionEnabled = false;
            if(segmentedControl.selectedSegmentIndex == 0){
                cell.setLabel(text: "You Aren't Selling Anything.");

            }
            else{
                cell.setLabel(text: "You Aren't Buying Anything");
            }
            return cell;
        }
        let cell = tableView.dequeueReusableCell(withIdentifier: "BookCell") as! BookCell
        cell.set(listing: displayed_listings[indexPath.row], bookCoverImageDictionary: self.bookCoverImageDictionary)
        return cell;
        
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(displayed_listings.count == 0){
            return 1;
        }
        return displayed_listings.count
    }
    
    func segmentedControlValueChanged(segmentedControl: UISegmentedControl){
        updateDisplayedListings()
    }
    
    func loadListings(done: @escaping (()->Void)){
        if(DataStore.get().socket_connected){
            let user_id = UserData.get()?.user_id
            DataStore.get().getListingsWithUserId(user_id: user_id!, callback: {listings in
                self.all_users_listings = listings;
                //load the book covers for each listing
//                for listing in self.all_users_listings{
//                    if let book = listing.book{
//                        guard let url = book.image_url else { return; }
//                         self.bookCoverImageDictionary[book.isbn13!] = UIApplication.shared.downloadImageSynchronously(url: url)
//                    }
//                }
                done();
            }, error_handler: { error in  DataStore.get().error_handler(error: error); done(); })
        }
        else{
            DataStore.get().error_handler(error: "Not connected to server")
            done();
        }
    }
    
    func updateDisplayedListings(){
        var listings = [Listing]();
        //get selling listings
        if(self.segmentedControl.selectedSegmentIndex == 0){
            for listing in all_users_listings{
                if(listing.user_id == UserData.get()?.user_id){
                    listings.append(listing);
                }
            }
        }
        //get buying listings
        if(self.segmentedControl.selectedSegmentIndex == 1){
            for listing in all_users_listings{
                if(listing.user_id != UserData.get()?.user_id){
                    listings.append(listing);
                }
            }
        }
        displayed_listings = listings;
        tableView.reloadData();
    }
    
    func handleRefresh(){
        loadListings(done: {
            self.updateDisplayedListings();
            self.refreshControl.endRefreshing()
        })
    }
    
    //if listing is under "buying" and if the user selects "Show Details" on pop up
//    func segueToListingDetailController(selectedListing: Listing){
//        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//        let controller : ListingDetailController = storyBoard.instantiateViewController(withIdentifier: "ListingDetailController") as! ListingDetailController
//        DataStore.get().getUser(user_id: selectedListing.user_id, callback: { user in
//            controller.set(listing: selectedListing, user: user);
//            self.present(controller, animated: true, completion: nil);
//        }, error_handler: DataStore.get().error_handler)
//    }
    
    //if listing is under "buying" and user selects "View Messages" on pop up
//    func segueToChatViewController(selectedListing: Listing){
//        DataStore.get().getUser(user_id: selectedListing.user_id, callback: {user in
//            let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//            let controller : ChatViewController = storyBoard.instantiateViewController(withIdentifier: "ChatViewController") as! ChatViewController
//            controller.set(listing: selectedListing, user: user);
//            self.present(controller, animated: true, completion: nil);
//        }, error_handler: DataStore.get().error_handler);
//    }
    
    //this is if the listing is under "Selling"
    func segueToListingViewController(selectedListing: Listing){
        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
        let controller : ListingViewController2 = storyBoard.instantiateViewController(withIdentifier: "ListingViewController2") as! ListingViewController2
        controller.set(listing: selectedListing)
        self.present(controller, animated: true, completion: nil);
    }
    
    func showActionSheet(selectedListing: Listing){
        let actionSheetTitle = selectedListing.book?.title!
        let alertController = UIAlertController(title: actionSheetTitle, message: nil, preferredStyle: UIAlertControllerStyle.actionSheet)
        let viewMessagesAction = UIAlertAction(title: "View Messages", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
            self.segueToChatViewController(selectedListing: selectedListing, selectedUserId: selectedListing.user_id)
        }
        let viewDetailsAction = UIAlertAction(title: "View Details", style: UIAlertActionStyle.default) { (result :UIAlertAction) -> Void in
            self.segueToListingDetailController(selectedListing: selectedListing)
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
        }
        alertController.addAction(viewMessagesAction);
        alertController.addAction(viewDetailsAction);
        alertController.addAction(cancelAction)
        self.present(alertController, animated: true, completion: nil)
    }

}
