//
//  Book.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import Foundation

class Book{
    var title: String?;
    var subtitle: String?;
    var authors: [String]?;
    var author_names: String?

    var isbn10: String?
    var isbn13: String?
    
    var publisher_name: String?;
    var date_published: String?;
    
    var description: String?
    var page_count: Int?
    var image_url: String?
    
    
    init(dictionary: Dictionary<String, Any>) {
        self.title =  dictionary["title"] as? String;
        self.subtitle = dictionary["subtitle"] as? String;
        
        self.authors = dictionary["authors"] as? [String];
        self.author_names = dictionary["author_names"] as? String

        self.isbn10 = dictionary["isbn10"] as? String;
        self.isbn13 = dictionary["isbn13"] as? String;
        
        self.publisher_name = dictionary["publisher_name"] as? String
        self.date_published = dictionary["date_published"] as? String
        
        self.description = dictionary["description"] as? String
        self.page_count = dictionary["page_count"] as? Int
        self.image_url = dictionary["image_url"] as? String
        
    }
    
    func toDictionary() -> Dictionary<String, Any>{
        var dictionary = [String: Any]();
        dictionary["title"] = self.title
        dictionary["subtitle"] = self.subtitle
        
        dictionary["authors"] = self.authors
        dictionary["author_names"] = self.author_names
        
        dictionary["isbn10"] = self.isbn10
        dictionary["isbn13"] = self.isbn13
        
        dictionary["publisher_name"] = self.publisher_name
        dictionary["date_published"] = self.date_published
        
        dictionary["description"] = self.description
        dictionary["page_count"] = self.page_count
        dictionary["image_url"] = self.image_url
        
        
        return dictionary;
    }
}
