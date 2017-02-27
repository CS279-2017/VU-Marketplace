//
//  ChatBarCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/5/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class ChatBarCell: UITableViewCell, UITextFieldDelegate{
    
    var transaction: Transaction?
    @IBOutlet weak var sendButton: UIButton!
    
    @IBOutlet weak var textField: UITextField!
    
    var isSendingChatMessage = false;
    
    var listenerSet = false;
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
//        textField.returnKeyType = .default;
        
    }
    
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
        
        textField.returnKeyType = .send
        
        textField.delegate = self;
        
        sendButton.addTarget(self, action: #selector(sendMessage), for: .touchUpInside)
        
        if(listenerSet == false){
            DataStore.get().addListener(listener: chatMessageSentListener, forEvent: "chat_message_sent", key: "ChatBarCell");
            listenerSet = true;
        }
        
        
        sendButton.tag = 100;
        
        updateTextFieldState(textField: textField);
        
        textField.addTarget(self, action: #selector(updateTextFieldState(textField:)), for: UIControlEvents.editingChanged)
        
        textField.autocorrectionType = .default
        textField.autocapitalizationType = .sentences
        textField.spellCheckingType = .default
        
//        textField.addTarget(self, action: #selector(sendButtonClicked(button:)), for: UIControlEvents.editingDidEnd);

//        textField.addTarget(self, action: #selector(sendButtonClicked(button:)), for: UIControlEvents);
    }
    
    
//    func sendButtonClicked(button: UIButton){
//        sendMessage();
//    }
    
    func sendMessage(){
        func callback(){
            print("message sent successfully!")
        }
        if(textField.text! != "" && isSendingChatMessage == false){
//            DataStore.sendMessage(<#T##DataStore#>)
//            DataStore.get().sendMessage(user_id: (UserData.get()?.user_id)!, password: (UserData.get()?.password)!, transaction_id: (transaction?._id)! , message_text: textField.text!, callback: callback, error_handler: DataStore.get().error_handler)
//            isSendingChatMessage = true;
//            updateTextFieldState(textField: textField);
        }
    }
    
    func updateTextFieldState(textField: UITextField){
        if(textField.text == "" && isSendingChatMessage == false){
            sendButton.isEnabled = false;
            sendButton.tintColor = UIColor.gray;
        }
        else{
            sendButton.isEnabled = true;
            sendButton.tintColor = self.contentView.tintColor;

        }
    }
    
    func chatMessageSentListener(data: Any){
//        let message_dictionary = (data as! Dictionary<String, Any>)["message"];
//        let message = Message(dictionary: message_dictionary as! Dictionary<String, Any>)
//        if(message.user_id == UserData.get()?.user_id){
//            textField.text = nil;
//            isSendingChatMessage = false;
//            updateTextFieldState(textField: textField)
//        }
    }
    
//    func textFieldDidBeginEditing(_ textField: UITextField) {
//        
//    }
    
//    func textFieldShouldEndEditing(_ textField: UITextField) -> Bool {
//        return false;
//    }
//       func textFieldDidBeginEditing(_ textField: UITextField) {
//        print("did begin editing");
//    }
//    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
//        return false;
//    }

//    func textFieldShouldEndEditing(_ textField: UITextField) -> Bool {
//        print("should end editing")
//        return false;
//    }
//    
//    func textFieldDidEndEditing(_ textField: UITextField) {
//        print("did end editing")
//    }
//    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
//        print("return button clicked")
////                textField.endEditing(false);
//        //        sendButtonClicked(button: sendButton);
//        return false;
//    }

}
