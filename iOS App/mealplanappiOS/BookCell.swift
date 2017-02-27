//
//  BookCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/12/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class BookCell: UITableViewCell{
    
    @IBOutlet weak var bookCoverImageView: UIImageView!
    @IBOutlet weak var authorNameLabel: UILabel!
    @IBOutlet weak var bookTitleLabel: UILabel!
   
    
    @IBOutlet weak var priceLabel: UILabel!
    
    @IBOutlet weak var soldLabel: UILabel!
     var listing: Listing?
    
    //isbn13 to image
//    var bookCoverImageDictionary = [String: UIImage]();
    
    
//
    override func awakeFromNib() {
        
       
    }
    func set(listing: Listing, bookCoverImageDictionary: [String: UIImage]?){
        self.listing = listing;
//        self.bookCoverDictionary = bookCoverImageDictionary;
        if let title = listing.book!.title{
            self.bookTitleLabel.text = title;
        }
        
        if let author_names = listing.book!.author_names{
            self.authorNameLabel.text = author_names;
        }
        else{
            self.authorNameLabel.text = "";
        }
        if let isbn13 = listing.book?.isbn13{
            if let image = DataStore.get().bookCoverImageDictionary[isbn13]{
                self.bookCoverImageView.image = image
            }
            else{
                if let image_url = listing.book?.image_url{
                    if let url = URL(string: image_url){
                        UIApplication.shared.downloadImage(url: url, done: {image in
                            DataStore.get().bookCoverImageDictionary[isbn13] = image;
                            self.bookCoverImageView.image = image;
                        })
                    }
                }
                self.bookCoverImageView.image = #imageLiteral(resourceName: "book_pic")
                
            }
        }
        else{
            self.bookCoverImageView.image = #imageLiteral(resourceName: "book_pic")
        }
        
        self.priceLabel.text = listing.price.toTwoDecimalPlaces();
        
        if(listing.sold == false){
            soldLabel.isHidden = true;
        }
        else{
            soldLabel.isHidden = false;
        }
    }
    
    
}
