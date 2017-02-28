//
//  CustomTextView.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/13/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit

class CustomTextView: UITextView{
    var placeHolderLabel = UILabel();
    
    let placeHolderColor = DataStore.get().placeHolderColor
    
    var textFieldInfo: TextFieldInfo?
    
    func setTextFieldInfo(textFieldInfo: TextFieldInfo){
        self.textFieldInfo = textFieldInfo;
        
        self.isScrollEnabled = false;
        self.font = UIFont.systemFont(ofSize: 17)
        //        textView.text = randomString(length: 140);
        self.returnKeyType = .done;
        self.text = textFieldInfo.text;
        
        
        placeHolderLabel.text = textFieldInfo.placeholder;
        placeHolderLabel.font = UIFont.systemFont(ofSize: (self.font?.pointSize)!)
        placeHolderLabel.sizeToFit()
        self.addSubview(placeHolderLabel)
        placeHolderLabel.frame.origin = CGPoint(x: 5, y: (self.font?.pointSize)! / 2)
        placeHolderLabel.textColor = placeHolderColor;
        placeHolderLabel.isHidden = !self.text.isEmpty
    }
    
//    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
////        if(text == "\n")
////        {
////            self.contentView.endEditing(true)
////            return false
////        }
////        //        let newText = (textView.text as NSString).replacingCharacters(in: range, with: text)
////        //        let numberOfChars = newText.characters.count // for Swift use count(newText)
////        //        print("numberOfChars: " + String(numberOfChars));
////        //        if let maxLength = self.textFieldInfo?.maxLength{
////        //            print("numberOfChars: " + String(numberOfChars));
////        //            return numberOfChars <= maxLength;
////        //        }
////        //
////        //        return true;
////        
////        let currentCharacterCount = textView.text?.utf8.count
////        let newLength = currentCharacterCount! + text.utf8.count
////        if let maxLength = textFieldInfo?.maxLength{
////            return newLength <= maxLength;
////        }
//        return true;
//    }
    
    func randomString(length: Int) -> String {
        
        let letters : NSString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let len = UInt32(letters.length)
        
        var randomString = ""
        
        for _ in 0 ..< length {
            let rand = arc4random_uniform(len)
            var nextChar = letters.character(at: Int(rand))
            randomString += NSString(characters: &nextChar, length: 1) as String
        }
        
        return randomString
    }
}
