//
//  TextFieldInfo.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/13/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TextFieldInfo{
    var placeholder: String;
    var type:TextFieldCell.TextFieldType
    var text: String?;
    var keyboardType: UIKeyboardType?
    var maxLength: Int?
    
    init(placeholder: String, type: TextFieldCell.TextFieldType, text:String?, keyboardType: UIKeyboardType?, maxLength: Int?){
        self.placeholder = placeholder
        self.type = type;
        self.text = text;
        self.keyboardType = keyboardType;
        self.maxLength = maxLength;
    }
}

