//
//  MakeListingController3.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/13/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class MakeListingController3: BaseController, UITableViewDelegate, UITableViewDataSource, UITextFieldDelegate, UITextViewDelegate{
    
    @IBOutlet weak var titleTextField: UITextField!
    @IBOutlet weak var descriptionTextView: CustomTextView!
    @IBOutlet weak var tableViewSearchResults: UITableView!
    
    @IBOutlet weak var priceTextField: UITextField!
    @IBOutlet weak var doneButton: UIBarButtonItem!
    @IBOutlet weak var cancelButton: UIBarButtonItem!
    var selectedBook: Book?
    
    var search_results = [Book]();
    
    var loadingSearchResults = false;
    
    var search_query: String?
    
    var listing: Listing?
    
    override func viewDidLoad() {
        tableViewSearchResults.delegate = self;
        tableViewSearchResults.dataSource = self;
        tableViewSearchResults.tableHeaderView = UIView();
        tableViewSearchResults.tableFooterView = UIView();
        tableViewSearchResults.backgroundColor = UIColor.lightGray
        tableViewSearchResults.layer.zPosition = 1;
//        tableViewSearchResults.isHidden = true;
        hideSearchResults();
        tableViewSearchResults.rowHeight = UITableViewAutomaticDimension
        tableViewSearchResults.estimatedRowHeight = 40;
        tableViewSearchResults.keyboardDismissMode = .onDrag
        
        titleTextField.returnKeyType = .search
        titleTextField.delegate = self;
        titleTextField.placeholder = "Title Of The Book"
        titleTextField.autocorrectionType = .default
        titleTextField.autocapitalizationType = .sentences
        if(self.listing == nil){
            titleTextField.becomeFirstResponder()
        }
        titleTextField.addTarget(self, action: #selector(textFieldDidChange(_:)), for: .editingChanged)
        titleTextField.enablesReturnKeyAutomatically = true;
        
        titleTextField.text = listing?.book?.title;


        
        priceTextField.placeholder = "Price";
        priceTextField.delegate = self;
        priceTextField.keyboardType = .decimalPad
        
        priceTextField.text = listing?.price.toTwoDecimalPlaces();
        
        descriptionTextView.text = "";
        let textFieldInfo = TextFieldInfo(placeholder: "Description / Condition Of The Book", type: .singleLine, text: "", keyboardType: .default, maxLength: 500)
        descriptionTextView.setTextFieldInfo(textFieldInfo: textFieldInfo)
        descriptionTextView.delegate = self;
        descriptionTextView.returnKeyType = .default
        if(self.listing != nil && self.listing?.description != nil && self.listing!.description!.characters.count != 0){
            descriptionTextView.placeHolderLabel.isHidden = true;
        }
        
        descriptionTextView.text = listing?.description
        
//        let keyboardToolbar = UIToolbar()
//        keyboardToolbar.sizeToFit()
//        keyboardToolbar.isTranslucent = false
//        keyboardToolbar.barTintColor = UIColor.white()
//        let sellBookButton = UIBarButtonItem(
//                    barButtonSystemItem: .
//                    target: self,
//                    action: #selector(sellBookButtonClicked)
//                )
//                sellBookButton.tintColor = UIColor.black
//                keyboardToolbar.items = [sellBookButton]
        
        
        let screenSize = UIScreen.main.bounds
        let screenWidth = screenSize.width
//        let screenHeight = screenSize.height
        
        let sellBookButton = UIButton()
        sellBookButton.frame = CGRect(x: 0, y: 0, width: screenWidth, height: 40)
        sellBookButton.setTitle("Sell Book", for: .normal)
        sellBookButton.addTarget(self, action: #selector(sellBookButtonClicked), for: .touchUpInside)
        sellBookButton.setTitleColor(UIColor.white, for: .normal)
        sellBookButton.setTitleColor(UIColor.lightGray, for: .highlighted)
        
        if(listing != nil){
            sellBookButton.setTitle("Save Changes", for: .normal);
        }
        
        
        let customView = UIView(frame: CGRect(x: 0, y: 0, width: 300, height: 40))
        customView.backgroundColor = UIView().tintColor;
        customView.addSubview(sellBookButton);
        
        descriptionTextView.inputAccessoryView = customView
        
        priceTextField.inputAccessoryView = customView;
        
        doneButton.action = #selector(doneButtonClicked)
        doneButton.tintColor = UIColor.clear
        
        cancelButton.action = #selector(cancelButtonClicked);
//        CGRect(x: 0, y: 0, width: 10, height: 100)
//
//        sellBookButton.sizeToFit();
        
//
//        descriptionTextView.inputAccessoryView = sellBookButton
        
        
        
    }
    
    func set(listing: Listing){
        self.listing = listing;
        selectedBook = listing.book
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
        return 0;
        
//        return search_results.count;
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        
        if tableView == tableViewSearchResults{
            if(indexPath.row == search_results.count){
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
            let cell = tableView.dequeueReusableCell(withIdentifier: "SearchResultCell") as! SearchResultCell
            cell.setBook(book: search_results[indexPath.row])
            return cell;
        }
        return UITableViewCell();
        
    }
    
    func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
        if(tableView == tableViewSearchResults){
            if cell is SearchResultCell && !loadingSearchResults && search_results.count > 0 && indexPath.row == search_results.count - 1 && search_results.count % DataStore.get().maxResultsSearchResults == 0{
                //show some indicator to indicator start loading
                loadingSearchResults = true
                DataStore.get().searchBooks(search_query: self.search_query!, start_index: search_results.count, callback: {books in
                    //hide some indicator to show done loading
                    self.search_results.append(contentsOf: books)
                    self.tableViewSearchResults.reloadData();
                    self.loadingSearchResults = false;
                }, error_handler: { error in
                    //hide some indicator to show done loading
                    DataStore.get().error_handler(error: error);
                    self.loadingSearchResults = false;
                })
            }
        }
    }
    
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if tableView == tableViewSearchResults{
            selectedBook = search_results[indexPath.row];
            titleTextField.text = selectedBook?.title;
//            tableViewSearchResults.isHidden = true;
            hideSearchResults();
            titleTextField.endEditing(true);
            priceTextField.becomeFirstResponder()

//            descriptionTextView.isHidden = false;
        }
        
    }
    
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {        return nil;
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return 1;
    }
    
    //if user clicks on textField, if there is a book selected, show the done button, otherwise don't show
    func textFieldDidBeginEditing(_ textField: UITextField) {
        if(textField == titleTextField){
//            tableViewSearchResults.isHidden = false;
            showSearchResults();
            if(selectedBook != nil){
                self.doneButton.tintColor = UIView().tintColor;
                self.doneButton.style = .done
                self.doneButton.isEnabled = true;
            }
            else{
                self.doneButton.tintColor = UIColor.clear;
                self.doneButton.isEnabled = false;
            }
        }
    }
    
    //if user modifies query, wipe the selectedBook
    func textFieldDidChange(_ textField: UITextField) {
        if(textField == titleTextField){
            selectedBook = nil;
            self.doneButton.tintColor = UIColor.clear;
            self.doneButton.isEnabled = false;
            if let selectedRowIndexPath = tableViewSearchResults.indexPathForSelectedRow{
                tableViewSearchResults.deselectRow(at: selectedRowIndexPath, animated: false)
            }
        }
    }
    
    func textFieldDidEndEditing(_ textField: UITextField) {
        if(textField == titleTextField){
            if(textField.text == "" || textField.text == nil){
                search_results = [Book]();
                tableViewSearchResults.reloadData();
            }
            self.doneButton.tintColor = UIColor.clear;
            self.doneButton.isEnabled = false;
            self.cancelButton.tintColor = UIView().tintColor;
            self.cancelButton.isEnabled = true;
        }
        if(textField == priceTextField){
            priceTextField.text = cleanDollars(textField.text)
        }
    }
    
    func cleanDollars(_ value: String?) -> String {
        let value = value?.replacingOccurrences(of: "$", with: "")
        guard value != nil else { return "$0.00" }
        let doubleValue = Double(value!) ?? 0.0
        let formatter = NumberFormatter()
        formatter.currencyCode = "USD"
        formatter.currencySymbol = "$"
        formatter.minimumFractionDigits = (value!.contains(".00")) ? 0 : 2
        formatter.maximumFractionDigits = 2
        formatter.numberStyle = .currencyAccounting
        return formatter.string(from: NSNumber(value: doubleValue)) ?? "$\(doubleValue)"
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        if(textField == titleTextField){
            if(DataStore.get().socket_connected){
                self.showActivityIndicator();
                self.search_query = titleTextField.text;
                DataStore.get().searchBooks(search_query: textField.text!, start_index: 0, callback: {books in
                    self.hideActivityIndicator();
                    self.search_results = books;
                    self.tableViewSearchResults.reloadData();
                }, error_handler: { error in
                    self.hideActivityIndicator();
                    DataStore.get().error_handler(error: error);
                })
            }
            else{
                DataStore.get().error_handler(error: "Not Connected to server");
            }
            
            return false;
        }
        return true;
    }
    
    func textViewDidChange(_ textView: UITextView) {
        (textView as! CustomTextView).placeHolderLabel.isHidden = !textView.text.isEmpty
    }
    
    func sellBookButtonClicked(){
        print("sellBookButtonClicked")
        let error_handler = DataStore.get().error_handler;
        guard let selectedBook = selectedBook else {
            error_handler("Select A Book")
            return;
        }
        guard selectedBook.isbn13 != nil else {
             error_handler("This Book Doesn't Have An ISBN13 Number, Select Another Book")
            return;
        }
        guard let title = selectedBook.title else{
            error_handler("This Book Doesn't Have A Title, Select Another Book")
            return;
        }
        guard let authors = selectedBook.authors else{
            error_handler("This Book Doesn't Have an Author, Select Another Book");
            return;
        }
        var author_names = "";
        for author in authors{
            if(author_names != ""){
                author_names += "; "
            }
            author_names += author;
        }
        guard let priceText = priceTextField.text else{
            error_handler("Enter A Price")
            return;
        }
        guard let price = Double(priceText.replacingOccurrences(of: "$", with: "")) else{
            error_handler("Enter A Valid Monetary Amount")
            return;
        }
        
        showActivityIndicator();
        
        if(self.listing == nil){
            DataStore.get().makeListing(book: selectedBook, description: descriptionTextView.text, price: price, callback: { listing in
                print("makeListing successful!")
                self.hideActivityIndicator();
                self.dismiss(animated: false, completion: {
                    self.segueToListingDetailController(selectedListing: listing);
                });
            }, error_handler: {error in
                self.hideActivityIndicator();
                DataStore.get().error_handler(error: error);
            })
        }
        else{
            DataStore.get().updateListing(listing_id: (self.listing?._id)!, book: selectedBook, description: descriptionTextView.text, price: price, callback: { listing in
                self.hideActivityIndicator();
                    print("updateListing successful!")
                self.dismiss(animated: false, completion: {
                    if let topViewController =  UIApplication.shared.topViewController(){
                        let listingDetailController = topViewController as? ListingDetailController;
                        listingDetailController?.listing?.description = self.descriptionTextView.text
                        listingDetailController?.listing?.price = price;
                        listingDetailController?.listing?.book = selectedBook
                        listingDetailController?.tableView.reloadData();
                    }
                });
            }, error_handler: {error in
                self.hideActivityIndicator();
                DataStore.get().error_handler(error: error);
            })
        }
    }
    
    func doneButtonClicked(){
        print("doneButtonClicked");
        titleTextField.endEditing(true);
//        tableViewSearchResults.isHidden = true;
        hideSearchResults();
    }
    
    func cancelButtonClicked(){
        print("cancelButtonClicked");
        self.dismiss(animated: false, completion: nil)
    }
    
    func showSearchResults(){
        tableViewSearchResults.isHidden = false;
        priceTextField.isHidden = true;
        descriptionTextView.isHidden = true;
    }
    
    func hideSearchResults(){
        tableViewSearchResults.isHidden = true;
        priceTextField.isHidden = false;
        descriptionTextView.isHidden = false;
    }
    
//    func segueToListingDetailController(selectedListing: Listing){
//        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//        let controller : ListingDetailController = storyBoard.instantiateViewController(withIdentifier: "ListingDetailController") as! ListingDetailController
//        DataStore.get().getUser(user_id: selectedListing.user_id, callback: { user in
//            controller.set(listing: selectedListing, user: user);
//            if let topViewController = UIApplication.topViewController() {
//                topViewController.present(controller, animated: true, completion: nil);
//            }
//        }, error_handler: DataStore.get().error_handler)
//        
//        
//    }
    
}
