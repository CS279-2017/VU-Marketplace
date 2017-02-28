//
//  ButtonCollectionCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/23/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class ButtonCollectionViewCell:UICollectionViewCell{
    
    @IBOutlet weak var button: UIButton!
    
    var buttonInfo: ButtonInfo?
    
    override func awakeFromNib() {
        button.layer.borderWidth = 1;
        button.layer.borderColor = UIView().tintColor.cgColor;
    }
    
    func setButtonInfo(buttonInfo: ButtonInfo){
        self.buttonInfo = buttonInfo
        button.addTarget(self, action: #selector(buttonClicked) , for: .touchUpInside)
        button.setTitle(buttonInfo.title, for: .normal)
    }
    
    func buttonClicked(){
        buttonInfo?.handler(button);
    }
}
