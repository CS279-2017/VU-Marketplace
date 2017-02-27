//
//  Picture.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/30/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class Picture{
    var image: UIImage?
    var _id: String?
    var index: Int?
    var modified: Bool = false;
    
    init(image: UIImage?, picture_id: String?){
        self.image = image;
        self._id = picture_id;
    }
    
    init(image: UIImage?, picture_index: Int?){
        self.image = image;
        self.index = picture_index
    }
    
    func setImage(image: UIImage){
        self.image = image;
        self.modified = true;
    }
    
    func setPictureId(picture_id: String){
        self._id = picture_id;
    }
    
    func setPictureIndex(picture_index: Int){
        self.index = picture_index;
    }
    
}

