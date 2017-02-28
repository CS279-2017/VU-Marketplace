//
//  ButtonCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/29/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class ButtonCell: UITableViewCell{
    @IBOutlet weak var stackView: UIStackView!    
    var buttonInfoArray: [ButtonInfo]?
    
    override init(style: UITableViewCellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier);
    }
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    
    
    func setButtons(buttonInfoArray:[ButtonInfo]){
        //remove the placeholder button
        self.buttonInfoArray = buttonInfoArray;
        if(stackView.subviews.count == 0){
            for buttonInfo in buttonInfoArray{
                let button = UIButton(type: UIButtonType.system)
    //            button.frame = CGRect(x: 0, y: 0, width: 100, height: 50)
    //            button.widthAnchor.constraint(equalToConstant: 100)
    //            button.heightAnchor.constraint(equalToConstant: 50);
                button.setTitle(buttonInfo.title, for: .normal)
                button.addTarget(self, action: #selector(buttonPressed(button:)), for: .touchUpInside)
                button.layer.borderWidth = 1;
                button.layer.borderColor = button.tintColor.cgColor
                button.tag = 100;
                stackView.addArrangedSubview(button)
            }
        }
        print("Number of buttons: " + String(stackView.arrangedSubviews.count))
        print("button title: " + (stackView.arrangedSubviews[0] as! UIButton).currentTitle!);
        

    }
    
    func buttonPressed(button: UIButton){
        var i = 0;
        for view in stackView.arrangedSubviews{
            let b = view as! UIButton;
            if button == b{
                buttonInfoArray?[i].handler(button);
            }
            i += 1;
        }
        
    }
}
