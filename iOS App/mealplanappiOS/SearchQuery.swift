//
//  SearchQuery.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/11/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import Foundation

class SearchQuery{
    //text may be author name, title, isbn number etc.
    var text:String;
    var book: Book;
    
    init(text: String, book: Book){
        self.text = text;
        self.book = book;
    }
}
