//
//  SearchController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class SearchController: BaseController, UITableViewDelegate, UITableViewDataSource, UISearchBarDelegate{
    var all_active_listings = [Listing]();
    var displayed_listings = [Listing]();
    
    var selectedBook: Book?
    
    var search_query: String?
    
    var search_results = [Book]();
    
    var search_listing_results = [Listing]();
    
    var shouldDisplayListingResults = false;
    
    var bookCoverImageDictionary = [String: UIImage]();
    
    var searchBarSelected = false;
    
    var refreshControl = UIRefreshControl();
    
    let numberOfMostRecentListings = 20;
    
    var loadingListings = false;
    var loadingSearchResults = false// checks to see if loading data already called, prevents double loading data
    
    @IBOutlet weak var searchBar: UISearchBar!
    
    @IBOutlet weak var cancelButton: UIButton!
    @IBOutlet weak var tableViewListings: UITableView!
    @IBOutlet weak var tableViewSearchResults: UITableView!
    override func viewDidLoad() {
        tableViewSearchResults.delegate = self;
        tableViewSearchResults.dataSource = self;
        tableViewSearchResults.tableHeaderView = UIView();
        tableViewSearchResults.tableFooterView = UIView();
        tableViewSearchResults.backgroundColor = UIColor.lightGray
        tableViewSearchResults.layer.zPosition = 1;
        tableViewSearchResults.isHidden = true;
        tableViewSearchResults.rowHeight = UITableViewAutomaticDimension
        tableViewSearchResults.estimatedRowHeight = 40;
        tableViewSearchResults.keyboardDismissMode = .onDrag
        
        tableViewListings.delegate = self;
        tableViewListings.dataSource = self;
        tableViewListings.tableHeaderView = UIView();
        tableViewListings.tableFooterView = UIView();
        tableViewListings.layer.zPosition = 0;
        tableViewListings.isHidden = false;
        tableViewListings.rowHeight = UITableViewAutomaticDimension
        tableViewListings.estimatedRowHeight = 40;
        
        if #available(iOS 10.0, *) {
            tableViewListings.refreshControl = refreshControl
        } else {
            tableViewListings.addSubview(refreshControl);
        };
        
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: UIControlEvents.valueChanged)
        
        cancelButton.addTarget(self, action: #selector(cancelButtonClicked), for: .touchUpInside)
        
        searchBar.delegate = self;
        searchBar.placeholder = "Search For A Book"
        searchBar.enablesReturnKeyAutomatically = true;
        
//        refreshControl.beginRefreshing();
//        handleRefresh();
        
    }
    
    override func viewWillAppear(_ animated: Bool) {
        if(selectedBook == nil){
            cancelButton.isHidden = true;
        }
        else{
            cancelButton.isHidden = false;
        }
        if(searchBar.text == "" || searchBar.text == nil){
//            tableViewSearchResults.isHidden = true;
//            tableViewListings.isHidden = false;
        }
        refreshControl.beginRefreshing();
        handleRefresh();
    }
    
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int{
        if(tableView == tableViewSearchResults){
            if(search_results.count != 0 && search_results.count % DataStore.get().maxResultsSearchResults == 0){
                return search_results.count + 1;
            }
            else{
                return search_results.count;
            }
            return 0;
        }
        else{
            var displayed_listings = self.displayed_listings;
            if(shouldDisplayListingResults){
                displayed_listings = self.search_listing_results;
            }
            if(selectedBook != nil){
                if(section == 0){
                    return 1;
                }
                if(section == 1){
                    if(displayed_listings.count == 0){
                        return 1;
                    }
                    if(displayed_listings.count % DataStore.get().maxResultsListings == 0){
                        return displayed_listings.count + 1;
                    }
                    return displayed_listings.count;
                }
            }
            if(displayed_listings.count == 0){
                return 1;
            }
            if(displayed_listings.count % DataStore.get().maxResultsListings == 0){
                return displayed_listings.count + 1;
            }
            return displayed_listings.count;
        }
        
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        var displayed_listings = self.displayed_listings;
        if(shouldDisplayListingResults){ displayed_listings = self.search_listing_results; }
        if tableView == tableViewSearchResults{
            if(indexPath.row == search_results.count){
                let cell = UITableViewCell();
                let activityIndicatorView = UIActivityIndicatorView.init(activityIndicatorStyle: .gray)
                activityIndicatorView.tag = 30;
                activityIndicatorView.autoresizingMask = .flexibleWidth
                activityIndicatorView.startAnimating()
                activityIndicatorView.center = CGPoint(x: cell.contentView.bounds.size.width/2, y: cell.contentView.bounds.size.height/2)

                cell.addSubview(activityIndicatorView)
                cell.subviews[0].isHidden = true;
//                cell.backgroundColor = tableViewSearchResults.backgroundColor;
                return cell;
            }
            let cell = tableView.dequeueReusableCell(withIdentifier: "SearchResultCell") as! SearchResultCell
            cell.setBook(book: search_results[indexPath.row])
            return cell;
        }
        else{
            if selectedBook == nil && indexPath.section == 0{
                if(displayed_listings.count == 0){
                    let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell") as! LabelCell
                    cell.setLabel(text: "There Are No Recent Listings");
                    if(shouldDisplayListingResults){
                        cell.setLabel(text: "No Search Results");
                    }
                    cell.selectionStyle = .none;

                    return cell;
                }
                else{
                    var displayed_listings = self.displayed_listings;
                    if(shouldDisplayListingResults){ displayed_listings = self.search_listing_results; }
                    if(indexPath.row == displayed_listings.count){
                        let cell = UITableViewCell();
                        let activityIndicatorView = UIActivityIndicatorView.init(activityIndicatorStyle: .gray)
                        activityIndicatorView.autoresizingMask = .flexibleWidth
                        activityIndicatorView.startAnimating()
                        activityIndicatorView.center = CGPoint(x: cell.contentView.bounds.size.width/2, y: cell.contentView.bounds.size.height/2)
                        
                        cell.addSubview(activityIndicatorView)
                        cell.subviews[0].isHidden = true;
                        //                cell.backgroundColor = tableViewSearchResults.backgroundColor;
                        return cell;
                    }
                    let cell = tableView.dequeueReusableCell(withIdentifier: "BookCell") as! BookCell
                    if displayed_listings.count > indexPath.row{
                        let listing = displayed_listings[indexPath.row];
                        cell.set(listing: listing, bookCoverImageDictionary: self.bookCoverImageDictionary);
                        cell.isUserInteractionEnabled = true;
                    }
                    return cell;
                }
            }
            else if selectedBook != nil && indexPath.section == 0{
                let cell = tableView.dequeueReusableCell(withIdentifier: "SearchResultCell") as! SearchResultCell
                if let selectedBook = self.selectedBook{
                    cell.setBook(book: selectedBook)
                }
                cell.isUserInteractionEnabled = false;
                return cell;
            }
            else{
                var displayed_listings = self.displayed_listings;
                if(shouldDisplayListingResults){ displayed_listings = self.search_listing_results; }
                if(displayed_listings.count == 0){
                    let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell", for: indexPath) as! LabelCell
                    cell.setLabel(text: "Nobody Is Selling This Book")
                    cell.isUserInteractionEnabled = false;
                    return cell;
                }
                else{
                    let cell = tableView.dequeueReusableCell(withIdentifier: "ListingCell2") as! ListingCell2
                    let listing = displayed_listings[indexPath.row];

                    return cell;
                }
            }
            
        }
        
    }
    
    func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
        if(tableView == tableViewSearchResults){
            if cell is SearchResultCell && !loadingSearchResults && search_results.count > 0 && indexPath.row == search_results.count - 1 && search_results.count % DataStore.get().maxResultsSearchResults == 0{
                //show some indicator to indicator start loading
                loadingSearchResults = true
                DataStore.get().searchListings(search_query: self.search_query!, start_index: search_results.count, callback: {listings in
                    //hide some indicator to show done loading
                    self.search_listing_results.append(contentsOf: listings)
                    self.tableViewListings.reloadData();
//                    self.tableViewSearchResults.reloadData();
                    self.loadingSearchResults = false;
                    self.shouldDisplayListingResults = true;
                }, error_handler: { error in
                    //hide some indicator to show done loading
                    DataStore.get().error_handler(error: error);
                    self.loadingSearchResults = false;
                })
            }
        }
        else if(tableView == tableViewListings){
            if(cell is BookCell && !loadingListings && displayed_listings.count > 0 && indexPath.row == displayed_listings.count - 1 && displayed_listings.count % DataStore.get().maxResultsListings == 0 ){
                //show some indicator to indicator start loading
                loadingListings = true
                DataStore.get().getListingsMostRecent(start_index: displayed_listings.count, callback: { listings in
                    self.displayed_listings.append(contentsOf: listings);
                    self.tableViewListings.reloadData();
                    self.loadingListings = false;
                    if(listings.count == 0){
                        self.loadingListings = true;
                        DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(1), execute: {
                            
                            let cell = self.tableViewListings.cellForRow(at: IndexPath(row: self.displayed_listings.count, section: 0));
                            let label = UILabel(frame: CGRect(x: 0, y: 0, width: 200, height: 21))
//                            label.center = CGPoint(x: (cell?.contentView.bounds.size.width)!/2, y: (cell?.contentView.bounds.size.height)!/2)
//                            label.center = CGPoint(x: 160, y: 285)

                            label.textAlignment = .center
                            label.text = "No More Listings"
                            cell?.addSubview(label)
                            self.loadingListings = false;
                        })
                    }
                }, error_handler: { error in
                    DataStore.get().error_handler(error: error);
                    self.loadingListings = false;
                })
            }
        }
        //modulo ensures that if we reach the end of the results the activity indicator will not appear.
        if(indexPath.row == search_results.count){
            cell.subviews[0].isHidden = false;
        }
    
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if tableView == tableViewSearchResults{
            //if is search result cell make the title of book the search query otherwise
            //selects a query
            
            selectedBook = search_results[indexPath.row];
            searchBar.text = selectedBook?.title;
            loadListings {
//                self.tableViewSearchResults.isHidden = true;
//                self.tableViewListings.isHidden = false;
                self.tableViewListings.reloadData();
            }
            
            
            //perform search
            
            //        tableView.isHidden = true;
        }
        else if tableView == tableViewListings{
            tableView.deselectRow(at: indexPath as IndexPath, animated: true)
            var displayed_listings = self.displayed_listings;
            if(shouldDisplayListingResults){ displayed_listings = self.search_listing_results; }
            let listing = displayed_listings[indexPath.row];
            tableView.deselectRow(at: indexPath, animated: true);
            segueToListingDetailController(selectedListing: listing);
        }
    }
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        if(tableView == tableViewListings && section == 0 && selectedBook == nil){
            if(shouldDisplayListingResults){
                return "Search Results:"
            }
            return "Recently Listed Books:"
        }
        if(tableView == tableViewListings && section == 0 && selectedBook != nil){
            return "Selected Book:";
        }
        if(tableView == tableViewListings && section == 1 && selectedBook != nil){
            return "People Selling This Book:";
        }
        return nil;
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        if(tableView == tableViewListings){
            if(selectedBook != nil){
                return 2;
            }
            return 1;
        }
        return 1;
    }
    func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
        //send a message to server to perform search and display results
        if(DataStore.get().socket_connected){
            self.showActivityIndicator();
            self.search_query = searchBar.text;
            DataStore.get().searchListings(search_query: self.search_query!, start_index: 0, callback: {listings in
                self.hideActivityIndicator();
                self.search_listing_results = listings;
                self.shouldDisplayListingResults = true;
//                self.search_results = books;
                //            for book in books{
                //
                //            }
//                self.tableViewSearchResults.reloadData();
                self.tableViewListings.reloadData();
            }, error_handler: { error in
                self.hideActivityIndicator();
                DataStore.get().error_handler(error: error);
            })
        }
        else{
            DataStore.get().error_handler(error: "Not connected to server");
        }
        
//        tableView.isHidden = true;
    }
    
    func searchBarTextDidBeginEditing(_ searchBar: UISearchBar) {
//        tableViewSearchResults.isHidden = false;
        cancelButton.isHidden = false;
//        tableViewListings.isHidden = true;
    }
    
    func searchBarTextDidEndEditing(_ searchBar: UISearchBar) {
//        if(searchBar.text == "" || searchBar.text == nil){
//            tableViewSearchResults.isHidden = true;
//            tableViewListings.isHidden = false;
//        }
//        if(selectedBook == nil){
//            cancelButton.isHidden = true;
//        }
//        else{
//            cancelButton.isHidden = false;
//        }
    }
    
    func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
//        if(searchBar.text == "" || searchBar.text == nil){
//            search_results = [Book]();
//            tableViewSearchResults.reloadData();
//        }
        
//        if(searchBar.text != nil && searchBar.text != ""){
//            DataStore.get().searchBooks(search_query: searchBar.text!, callback: {books in
//                self.search_results = books;
//                self.tableViewSearchResults.reloadData();
//            }, error_handler: DataStore.get().error_handler)
//        }
    }
    
    func handleRefresh(){
        loadListings(done: {self.refreshControl.endRefreshing()});
    }
    
    func loadListings(done: @escaping (()->Void)){
        if(selectedBook == nil){
            DataStore.get().getListingsMostRecent(start_index: 0, callback: { listings in
                self.displayed_listings = listings;
                //load book cover images
                self.updateDisplayedListings();
                done();
            }, error_handler: { error in
                DataStore.get().error_handler(error: error)
                done();
            })
            //load recently added Listings
        }
        else{
            //loads all the listings for a specific book
            func callback(listings: [Listing]){
                self.displayed_listings = listings;
                //load book cover images
//                for listing in listings{
//                    if let book = listing.book{
//                        guard let url = book.image_url else { return; }
//                        self.bookCoverImageDictionary[book.isbn13!] = UIApplication.shared.downloadImageSynchronously(url: url)
//                    }
//                }
                updateDisplayedListings();
                done();
            }
            if let isbn13 = selectedBook?.isbn13{
                DataStore.get().getListingsWithIsbn(isbn13: isbn13, callback: callback, error_handler: { error in
                    DataStore.get().error_handler(error: error);
                    done();
                })
            }
            else{
                done();
            }
        }
    }
    
    func updateDisplayedListings(){
        tableViewListings.reloadData();
    }
    
//    func segueToListingDetailController(selectedListing : Listing){
//        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//        let controller : ListingDetailController = storyBoard.instantiateViewController(withIdentifier: "ListingDetailController") as! ListingDetailController
//        DataStore.get().getUser(user_id: selectedListing.user_id, callback: { user in
//            controller.set(listing: selectedListing, user: user);
//            self.present(controller, animated: true, completion: nil);
//        }, error_handler: DataStore.get().error_handler)
//    }
    
    func cancelButtonClicked(){
        searchBar.text = nil;
        selectedBook = nil;
//        search_results = [Book]();
        shouldDisplayListingResults = false;
        search_listing_results = [Listing]();
        tableViewSearchResults.reloadData();
        viewWillAppear(true);
    }
}
