//
//  ProfileController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/20/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class ProfileViewController: BaseController, UITableViewDelegate, UITableViewDataSource{
    
    @IBOutlet weak var backButton: UIBarButtonItem!
    @IBOutlet weak var navigationBarTitle: UINavigationItem!
    
    @IBOutlet weak var tableView: UITableView!
    
    var user: User?
    
    var refreshControl = UIRefreshControl();

    
    var displayed_listings = [Listing]();
    
    override func viewDidLoad() {
        tableView.dataSource = self;
        tableView.delegate = self;
        tableView.estimatedRowHeight = 140;
        tableView.rowHeight = UITableViewAutomaticDimension;
        tableView.tableFooterView = UIView();
        
        backButton.action = #selector(backButtonClicked);
        
        if #available(iOS 10.0, *) {
            tableView.refreshControl = refreshControl
        } else {
            tableView.addSubview(refreshControl);
        };
        
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: UIControlEvents.valueChanged)
        
        if let user = self.user{
            navigationBarTitle.title = user.first_name! + " " + user.last_name!
        }
    }
    
    func handleRefresh(){
        loadListings(done: {self.refreshControl.endRefreshing()});
    }
    
    override func viewWillAppear(_ animated: Bool) {
        refreshControl.beginRefreshing();
        handleRefresh();
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if(indexPath.section == 1){
            if(displayed_listings.count > 0){
                tableView.deselectRow(at: indexPath, animated: true);
                segueToListingDetailController(selectedListing: displayed_listings[indexPath.row])
            }
        }
    }
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(indexPath.section == 0){
            let cell = tableView.dequeueReusableCell(withIdentifier: "UserCell4") as! UserCell4;
            cell.set(user: self.user!)
            cell.isUserInteractionEnabled = true;
            cell.selectionStyle = .none;
            return cell;
        }
        if(indexPath.section == 1)
        {
            if(displayed_listings.count > 0){
                let cell = tableView.dequeueReusableCell(withIdentifier: "BookCell") as! BookCell
                cell.set(listing: displayed_listings[indexPath.row], bookCoverImageDictionary: nil);
                return cell;
            }
            else{
                let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell") as! LabelCell;
                cell.setLabel(text: "User Is Not Selling Anything." );
                cell.selectionStyle = .none;

                return cell;
            }
        }
        return UITableViewCell();
    }
    
    func updateDisplayedListings(){
        tableView.reloadData();
    }
    
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(section == 0){
            return 1;
        }
        if(section == 1){
            if(displayed_listings.count == 0){
                return 1;
            }
            else{
                return displayed_listings.count
            }
        }
        return 0;
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return 2;
    }
    
    func set(user: User){
        self.user = user;
        
    }
    
    func loadListings(done: @escaping (()->Void)){
        if(DataStore.get().socket_connected){
            if let selling_listing_ids = user?.selling_listing_ids{
                DataStore.get().getListings(listing_ids: selling_listing_ids, callback: {listings in
                    self.displayed_listings = listings;
                    self.displayed_listings.sort {
                        $0.creation_time > $1.creation_time
                    }
                    self.updateDisplayedListings();
                    done();
                }, error_handler: {error in
                    DataStore.get().error_handler(error: error)
                    done();
                })
            }
            else{
                done();
            }
        }
        else{
            DataStore.get().error_handler(error: "Not connected to server")
            done();
        }
    }
    
//    func segueToListingDetailController(selectedListing: Listing){
//        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//        let controller : ListingDetailController = storyBoard.instantiateViewController(withIdentifier: "ListingDetailController") as! ListingDetailController
//        DataStore.get().getUser(user_id: selectedListing.user_id, callback: { user in
//            controller.set(listing: selectedListing, user: user);
//            self.present(controller, animated: true, completion: nil);
//        }, error_handler: DataStore.get().error_handler)
//    }
//    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        if(section == 1){
            return "Books That This User Is Currently Selling:"
        }
        return nil;
    }
    
    func backButtonClicked(){
        self.dismiss(animated: false, completion: nil);
    }
    
    
}

