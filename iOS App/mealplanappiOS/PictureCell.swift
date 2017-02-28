//
//  PictureCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/29/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class PictureCell: UICollectionViewCell{
    
    @IBOutlet weak var imageView: UIImageView!
    @IBOutlet weak var activityIndicator: UIActivityIndicatorView!
    var picture: Picture?;
    var delegate: SelectPictureDelegate?;
    
    var myActivityIndicator: UIActivityIndicatorView?
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    override func awakeFromNib() {
        imageView.image = nil;
        imageView.contentMode = UIViewContentMode.scaleAspectFit
        myActivityIndicator = UIActivityIndicatorView(activityIndicatorStyle: UIActivityIndicatorViewStyle.gray)
        myActivityIndicator?.center = imageView.center
        myActivityIndicator?.startAnimating()
        myActivityIndicator?.hidesWhenStopped = true;
        imageView.addSubview(myActivityIndicator!)
    }
    
    func setPicture(picture: Picture){
        self.picture  = picture;
        imageView.image = picture.image;
        if(self.picture?.image != nil){
            myActivityIndicator?.stopAnimating();
        }
        
    }
    
    func setTappedHandler(handler: ButtonInfo){
        
    }
    
//    func getPictureResponseListener(data: Any){
//        let data = data as! Dictionary<String, Any>
//        let picture_id = data["picture_id"] as! String;
//        let picture = data["picture"] as! Data;
//        if(self.picture?._id == picture_id){
//            self.picture?.image = UIImage(data: picture)
//            self.setPicture(picture: self.picture!);
//        }
//    }
    
}
