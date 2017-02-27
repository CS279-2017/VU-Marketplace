//
//  TransactionCell3.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class TransactionCell3: UITableViewCell{
    
    @IBOutlet weak var bookTitleLabel: UILabel!
    @IBOutlet weak var bookAuthorNameLabel: UILabel!
    @IBOutlet weak var bookPriceLabel: UILabel!
    
    var transaction: Transaction?
    
    
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
        if let title = transaction.title{
             self.bookTitleLabel.text = title;
        }
       
        if let author_names = transaction.author_names{
            self.bookAuthorNameLabel.text = author_names;
        }
        else{
            self.bookAuthorNameLabel.text = "";
        }
        if let price = transaction.price{
            self.bookPriceLabel.text = price.toTwoDecimalPlaces();
        }
//        let listing_id = transaction.listing_id;
//        DataStore.get().getListing(listing_id: listing_id, callback: {listing in
//            let listing = Listing(dictionary: listing);
//        }, error_handler: DataStore.get().error_handler);
    }
    
    
}
