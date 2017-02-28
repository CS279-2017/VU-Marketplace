//
//  TapImageView.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/31/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TapImageView: UIImageView, UIGestureRecognizerDelegate{
    
    var tapGestureRecognizer: UITapGestureRecognizer?
    
    override func awakeFromNib() {
        
        self.tapGestureRecognizer = UITapGestureRecognizer(target:self, action: #selector(onTapped));
        
        tapGestureRecognizer!.cancelsTouchesInView = true;
        tapGestureRecognizer!.delegate = self;
        
        self.isUserInteractionEnabled = true
        self.addGestureRecognizer(tapGestureRecognizer!)
    }
    
    
    func onTapped(){
        print("TapImageView was tapped!")
        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
        let controller : PictureDisplayController = storyBoard.instantiateViewController(withIdentifier: "PictureDisplayController") as! PictureDisplayController
        if let image = self.image{
            controller.setImage(image: image);
        }
        
        UIApplication.topViewController()?.present(controller, animated: true, completion: nil);
    }
    
}
