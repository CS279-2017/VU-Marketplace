//
//  ListingController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/15/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit
import SocketIO

class ListingController: UIViewController, UITableViewDelegate, UITableViewDataSource{
    @IBOutlet weak var tableView: UITableView!
    @IBOutlet weak var segmentedControl: UISegmentedControl!
    
    var all_active_listings = [Listing]();
    var displayed_listings = [Listing]();
    
    var refreshControl = UIRefreshControl();

    
    //TODO: add Timer to update Listing Cell Expire times
    
    override func viewDidLoad() {
        super.viewDidLoad();
        self.tableView.delegate = self;
        self.tableView.dataSource = self;
        tableView.rowHeight = UITableViewAutomaticDimension
        tableView.estimatedRowHeight = 200
//        tableView.allowsSelection = true;
//        tableView.isUserInteractionEnabled = true;
        tableView.tableHeaderView = UIView();
        tableView.tableFooterView = UIView();
        
        if #available(iOS 10.0, *) {
            tableView.refreshControl = refreshControl
        } else {
            tableView.addSubview(refreshControl);
        };
        
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: UIControlEvents.valueChanged)
        loadActiveListings(callback2: { self.updateDisplayedListings(); });

        tableView.backgroundColor = UIColor(red: 247/255, green: 247/255, blue: 247/255, alpha: 1);
        
//        _ = Timer.scheduledTimer(timeInterval: 1.0, target: self, selector: #selector(self.updateExpireTimesForAllCells), userInfo: nil, repeats: true);
        
        //every time user loads ListingController they request a copy of all the active listings from the server, does ListingController only load once or every time the user switches away and then back to this screen?
        
        segmentedControl.addTarget(self, action: #selector(segmentedControlValueChanged(segmentedControl:)), for: UIControlEvents.valueChanged);
        segmentedControl.isMomentary = false;
        
        DataStore.get().socket.on("connect", callback: { _ in self.segmentedControlValueChanged(segmentedControl: self.segmentedControl)})
        DataStore.get().socket.on("reconnect", callback: { _ in self.segmentedControlValueChanged(segmentedControl: self.segmentedControl)})
        
        //add listeners for 'listing_added'
        func listingMadeListener(data: Any){
            print("listing_made handler called");
            let data = data as! Dictionary<String, Any>
            let listing_dictionary = data["listing"] as! Dictionary<String, Any>;
            let listing = Listing(dictionary: listing_dictionary);
            addListing(listing: listing)
            if(DataStore.get().getUserInfo(user_id: listing.user_id) == nil){
                DataStore.get().getUser(user_id: listing.user_id, callback: {_ in
                    self.updateDisplayedListings();
                }, error_handler: DataStore.get().error_handler)
            }
            if(DataStore.get().getUserProfilePicture(user_id: listing.user_id) == nil){
                DataStore.get().getProfilePicture(user_id: listing.user_id, callback: {_ in
                    self.updateDisplayedListings();
                }, error_handler: DataStore.get().error_handler)
            }
            //make a listing from the Dictionary<String, Any> and add it to the listings
        }
        DataStore.get().addListener(listener: listingMadeListener, forEvent: "listing_made", key: "ListingController");
        
        func listingUpdatedListener(data: Any){
            print("listing_updated handler called");
            let data = data as! Dictionary<String, Any>
            let updated_dictionary = data["listing"] as! Dictionary<String, Any>;
            let updated_listing = Listing(dictionary: updated_dictionary);
            for listing in all_active_listings{
                if(listing._id == updated_listing._id){
                    listing.update(listing: updated_listing);
                }
            }
            updateDisplayedListings();
        }
        DataStore.get().addListener(listener: listingUpdatedListener, forEvent: "listing_updated", key: "ListingController");
        
        //add listeners for 'listing_removed'
        func listingRemovedListener(data: Any){
            print("listing_removed handler called");
            let data = data as! Dictionary<String, Any>;
            let listing_id = data["listing_id"] as! String;
            removeListing(listing_id: listing_id) //remove the listing in listings that matches the listing_id
        }
        
        DataStore.get().addListener(listener: listingRemovedListener, forEvent: "listing_removed", key: "ListingController");
        segmentedControlValueChanged(segmentedControl: self.segmentedControl);
    }
    
    override func viewWillAppear(_ animated: Bool) {
//        if(DataStore.get().socket_connected){
//            loadActiveListings(callback: {self.updateDisplayedListings();});
//        }
        initReconnectTimer();

    }
    
    override func viewDidAppear(_ animated: Bool) {
        updateDisplayedListings();
    }
    
    
    func handleRefresh(){
//        segmentedControlValueChanged()
        loadActiveListings(callback2: {self.refreshControl.endRefreshing()})
    }
    
    private func loadActiveListings(callback2: @escaping (()->Void)){
        var userIdSetUserInfo = Set<String>();
        var userIdSetProfilePicture = Set<String>();
        var pictureIdSet = Set<String>();
        print("loadActiveListings called!")
        if let userData = UserData.get(){
            let user_id = userData.user_id
            let password = userData.password
            func callback(all_active_listings: [Dictionary<String, Any>]){
                var new_listings = [Listing]();
                for dictionary in all_active_listings{
                    let listing = Listing(dictionary: dictionary)
                    if(DataStore.get().getUserInfo(user_id: listing.user_id) == nil){
                        userIdSetUserInfo.insert(listing.user_id);
                    }
                    if(DataStore.get().getUserProfilePicture(user_id: listing.user_id) == nil){
                        userIdSetProfilePicture.insert(listing.user_id)
                    }
                    if let picture_ids = listing.picture_ids{
                        for picture_id in picture_ids{
                            if(DataStore.get().getUserPicture(picture_id: picture_id) == nil){
                                pictureIdSet.insert(picture_id);
                            }
                        }
                    }
                    new_listings.append(listing)
                }
                
                var numberOfProfilePicturesLoaded = 0;
                var numberOfUsersLoaded = 0;
                var numberOfPicturesLoaded = 0;
                
                func userLoadedCallback(){
                    numberOfUsersLoaded += 1;
                    print("userLoadedCallback #" + String(numberOfUsersLoaded));
                    if(numberOfUsersLoaded == userIdSetUserInfo.count){
                        updateDisplayedListings();
                        print("userLoadedCallback() all users loaded");
                    }
                }
                
                func profilePictureLoadedCallback(){
                    numberOfProfilePicturesLoaded += 1;
                    print("profilePictureLoadedCallback #" + String(numberOfProfilePicturesLoaded));
                    if(numberOfProfilePicturesLoaded == userIdSetProfilePicture.count){
                        updateDisplayedListings();
                         print("profilePictureLoadedCallback() all profile_pictures loaded");
                    }
                }
                
                func pictureLoadedCallback(){
                    numberOfPicturesLoaded += 1;
                    print("pictureLoadedCallback #" + String(numberOfPicturesLoaded));
                    if(numberOfPicturesLoaded == pictureIdSet.count){
                        updateDisplayedListings();
//                        let stopTime = Date().timeIntervalSince1970;
//                        print(stopTime - startTime);
                        print("pictureLoadedCallback() all pictures loaded");
                        callback2();
                    }
                }
                for userId in userIdSetProfilePicture{
                    DataStore.get().getProfilePicture(user_id: userId, callback: {_,_ in profilePictureLoadedCallback() }, error_handler: {_ in profilePictureLoadedCallback() });
                    
                }
                for userId in userIdSetUserInfo{
                    DataStore.get().getUser(user_id: userId, callback: { _ in userLoadedCallback() }, error_handler: {_ in userLoadedCallback() })
                }
                for pictureId in pictureIdSet{
                    DataStore.get().getPicture(picture_id: pictureId, callback: { _,_ in pictureLoadedCallback() }, error_handler: { _ in pictureLoadedCallback() });
                }
                
                new_listings.sort {
                    $0.creation_time > $1.creation_time
                }
                setListingsArray(listings: new_listings);
                updateDisplayedListings();
//                hideActivityIndicator();
//                self.hideProgressBar();
            }
            func error_handler_get_all_active_listings(error:String){
                print(error);
            }
            if(user_id != nil && password != nil){
//                if(DataStore.get().socket_connected){
//                    self.showProgressBar(msg: "Loading Listings", true, width: 200)
//                }
//                showActivityIndicator();
                DataStore.get().getAllActivateListings(user_id: user_id!, password: password!, callback: callback, error_handler: DataStore.get().error_handler)
            }
        }
        else{
            print("userData was nil");
        }

    }
    
    
    @objc private func updateExpireTimesForAllCells(){
        let cells = tableView.visibleCells;
        for cell in cells{
            let listingCell = cell as! ListingCell;
            if let expiration_time = listingCell.listing?.expiration_time{
                if(expiration_time > 0){
//                    listingCell.listing!.expiration_time -= 1;
                }
            }
        }
        tableView.reloadData();
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(displayed_listings.count == 0){
            return 1;
        }
        if(displayed_listings[section].picture_ids != nil && (displayed_listings[section].picture_ids?.count)! > 0){
            return 2;
        }
        return 1;
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        if(displayed_listings.count == 0){
            return 1;
        }
        return displayed_listings.count;

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
    //1. get dequeue ListingCell from tableView
    //2. get the listing from the listings array of this controller
    //3. call the setListing function of ListingCell, setting the listing of the ListingCell to the listing
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(displayed_listings.count == 0){
            let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell", for: indexPath) as! LabelCell
            if(segmentedControl.selectedSegmentIndex == 0){
                cell.setLabel(text: "Other People Aren't Selling Anything...")
            }
            else if(segmentedControl.selectedSegmentIndex == 1){
                cell.setLabel(text: "Other People Aren't Buying Anything...")
            }
            else if(segmentedControl.selectedSegmentIndex == 2){
                cell.setLabel(text: "You Have No Active Listings");
            }
            cell.isUserInteractionEnabled = false;
            return cell;
        }
        let listing = displayed_listings[indexPath.section];
        if(indexPath.row == 0){
            let cell = tableView.dequeueReusableCell(withIdentifier: "ListingCell", for: indexPath) as! ListingCell
            cell.setListing(listing: listing)
            return cell;
        }
        else{
            let cell = tableView.dequeueReusableCell(withIdentifier: "PicturesCell", for: indexPath) as! PicturesCell
            cell.setType(type: .view)

//            cell.setPictures(pictures: pictures)
            if let picture_ids = listing.picture_ids{
                var pictures = [Picture]();
                var pictures_loaded = 0;
                for picture_id in picture_ids{
                    if let image = DataStore.get().getUserPicture(picture_id:picture_id){
//                        for picture_id in picture_ids{
//                            if let image = DataStore.get().getUserPicture(picture_id:picture_id){
                                pictures.append(Picture(image: image, picture_id: picture_id))
////                            }
//                        }
//                        cell.setPictures(pictures: pictures)
//                        cell.collectionView.reloadData();

                    }
                    else{
                        pictures.append(Picture(image: nil, picture_id: picture_id))

//                        DataStore.get().getPicture(picture_id: picture_id, callback: {_,_ in
//
//                        }, error_handler: {_ in })
//                        pictures.append(Picture(image: nil, picture_id: picture_id))
                    }
                }
                cell.setListing(listing: listing)
                cell.setPictures(pictures: pictures)
                cell.collectionView.reloadData();
//                if(pictures.count == 0){
//                    cell.isHidden = true;
//                }
            }
            return cell;
        }
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        print("tableView cell clicked!")
        tableView.deselectRow(at: indexPath as IndexPath, animated: true)
       
    }
    
    //adds a listing to the listings array and then reloads the table, (cellForRow at will automatically recalculate and include the new listing in a cell)
    func addListing(listing: Listing){
        self.all_active_listings.insert(listing, at: 0)
        updateDisplayedListings();
    }
    
    //removes a listing using listing_id from the listings array and then reloads the table, (cellForRow at will automatically recalculate and include the new listing in a cell)
    func removeListing(listing_id: String){
        print("removeListing called")
        if let index = all_active_listings.index(where: {$0._id == listing_id}){
            all_active_listings.remove(at:index);
        }
        updateDisplayedListings();
    }
    
    //sets the listings array of the controller to a new [Listing]
    func setListingsArray(listings: [Listing]){
        self.all_active_listings = listings;
        updateDisplayedListings();
    }
    
    func segmentedControlValueChanged(segmentedControl: UISegmentedControl){
//        updateDisplayedListings();
//        loadActiveListings();
        updateDisplayedListings();
    }
    
    //must be called every time all_active_listings is changed so that the displayed listings can be adjusted to conform to all active_listings
    func updateDisplayedListings(){
        print("updateDisplayedListings called");
        var new_displayed_listings = [Listing]();
        //show buy listings
        
        if(segmentedControl.selectedSegmentIndex == 0){
            for listing in all_active_listings{
                if(listing.buy == false && listing.user_id != UserData.get()?.user_id){
                    new_displayed_listings.append(listing);
                }
            }
        }
        //show sell listings
        else if(segmentedControl.selectedSegmentIndex == 1){
            for listing in all_active_listings{
                if(listing.buy == true && listing.user_id != UserData.get()?.user_id){
                    new_displayed_listings.append(listing);
                }
            }
        }
        //shows the users own listings
        else if(segmentedControl.selectedSegmentIndex == 2){
            for listing in all_active_listings{
                if(listing.user_id == UserData.get()?.user_id){
                    new_displayed_listings.append(listing);
                }
            }
        }
        displayed_listings = new_displayed_listings;
        tableView.reloadData();
    }
    
    func error_handler(error: String){
        let alertController = UIAlertController(title: "Error", message: error, preferredStyle: UIAlertControllerStyle.alert)
        let okAction = UIAlertAction(title: "Ok", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
        }
        alertController.addAction(okAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
    func segueToListingViewController(selectedListing: Listing){
        let listing = selectedListing
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let controller = storyboard.instantiateViewController(withIdentifier: "ListingViewController") as! ListingViewController
        controller.setListing(listing: listing);
        self.present(controller, animated: true, completion: nil)
    }
    
}
