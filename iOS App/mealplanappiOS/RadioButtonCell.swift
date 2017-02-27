//
//  RadioButtonCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/14/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class RadioButtonCell:UITableViewCell{
    
    @IBOutlet weak var stackView: UIStackView!
    var buttonInfoArray:[ButtonInfo]?
    
    var selectedButtonIndex:Int? = nil
    
    var selectedTintColor = UIView.appearance().tintColor;
    var unselectedTintColor = DataStore.get().placeHolderColor;
    
    func setButtons(buttonInfoArray:[ButtonInfo], orientation: UILayoutConstraintAxis?){
        //remove the placeholder button
        self.buttonInfoArray = buttonInfoArray;
        if(stackView.subviews.count == 0){
            for buttonInfo in buttonInfoArray{
                let button = UIButton(type: UIButtonType.system)
                button.tintColor = unselectedTintColor;
                button.setTitle(buttonInfo.title, for: .normal)
                button.addTarget(self, action: #selector(buttonPressed(button:)), for: .touchUpInside)
                if(buttonInfo.selected != nil && buttonInfo.selected! == true){
                    button.tintColor = selectedTintColor
                }
//                button.layer.borderWidth = 1;
//                button.layer.borderColor = button.tintColor.cgColor
                stackView.addArrangedSubview(button)
            }
        }
        
        stackView.distribution = .fillEqually
        
        if let orientation = orientation{
            stackView.axis = orientation;
        }
        
        
        
    }
    
    func buttonPressed(button: UIButton){
        var i = 0;
        for view in stackView.arrangedSubviews{
            let b = view as! UIButton;
            if button == b{
                buttonInfoArray?[i].handler(button);
                selectedButtonIndex = i;
                
            }
            i += 1;
            b.tintColor = DataStore.get().placeHolderColor;
//            b.backgroundColor = UIColor.white;

        }
        button.tintColor = UIView.appearance().tintColor
        
    }
}
