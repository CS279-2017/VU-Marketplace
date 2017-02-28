//
//  TextViewCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/14/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class TextViewCell: UITableViewCell, UITextViewDelegate{
    
    @IBOutlet weak var textView: UITextView!
    
    var placeHolderLabel = UILabel();
    
    let placeHolderColor = DataStore.get().placeHolderColor
    
    var textFieldInfo: TextFieldInfo?
    
    func setTextFieldInfo(textFieldInfo: TextFieldInfo){
        self.textFieldInfo = textFieldInfo;
        
        textView.delegate = self;
        textView.isScrollEnabled = false;
        textView.font = UIFont.systemFont(ofSize: 17)
//        textView.text = randomString(length: 140);
        textView.returnKeyType = .done;
        textView.text = textFieldInfo.text;
        
        
        placeHolderLabel.text = textFieldInfo.placeholder;
        placeHolderLabel.font = UIFont.systemFont(ofSize: (textView.font?.pointSize)!)
        placeHolderLabel.sizeToFit()
        textView.addSubview(placeHolderLabel)
        placeHolderLabel.frame.origin = CGPoint(x: 5, y: (textView.font?.pointSize)! / 2)
        placeHolderLabel.textColor = placeHolderColor;
        placeHolderLabel.isHidden = !textView.text.isEmpty
    }
    
    
    func textViewDidChange(_ textView: UITextView) {
        placeHolderLabel.isHidden = !textView.text.isEmpty
    }
    
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
        if(text == "\n")
        {
            contentView.endEditing(true)
            return false
        }
//        let newText = (textView.text as NSString).replacingCharacters(in: range, with: text)
//        let numberOfChars = newText.characters.count // for Swift use count(newText)
//        print("numberOfChars: " + String(numberOfChars));
//        if let maxLength = self.textFieldInfo?.maxLength{
//            print("numberOfChars: " + String(numberOfChars));
//            return numberOfChars <= maxLength;
//        }
//        
//        return true;
        
        let currentCharacterCount = textView.text?.utf8.count        
        let newLength = currentCharacterCount! + text.utf8.count
        if let maxLength = textFieldInfo?.maxLength{
            return newLength <= maxLength;
        }
        return true;
    }
    
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
