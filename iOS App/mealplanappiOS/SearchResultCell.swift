//
//  SearchResultCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class SearchResultCell: UITableViewCell{
    
    @IBOutlet weak var bookCoverImageView: UIImageView!
    
    @IBOutlet weak var authorsNamesLabel: UILabel!
    @IBOutlet weak var bookTitleLabel: UILabel!
    var book: Book?
    override func awakeFromNib() {
        bookTitleLabel.numberOfLines = 0;
        bookTitleLabel.lineBreakMode = .byWordWrapping
        authorsNamesLabel.numberOfLines = 0;
        authorsNamesLabel.lineBreakMode = .byWordWrapping
    }
    
    func setBook(book: Book){
        self.book = book;
        if(book.authors != nil){
            var authorsNamesString = "";
            for author in book.authors!{
                if(authorsNamesString != ""){
                    authorsNamesString += ", "
                }
                authorsNamesString += author
            }
            self.authorsNamesLabel.text = authorsNamesString;
        }
        if(book.title != nil){
            self.bookTitleLabel.text = book.title!;
        }
        
        if let isbn13 = book.isbn13{
            if let image = DataStore.get().bookCoverImageDictionary[isbn13]{
                self.bookCoverImageView.image = image
            }
            else{
                if let image_url = book.image_url{
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
    }
}
