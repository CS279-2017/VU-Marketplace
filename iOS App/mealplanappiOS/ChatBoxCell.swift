//
//  ChatBoxCell.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 12/5/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit

class ChatBoxCell: UITableViewCell, UITableViewDelegate, UITableViewDataSource{
    
    var transaction: Transaction?;
    @IBOutlet weak var tableView: UITableView!
    
    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
    }
    
    func setTransaction(transaction: Transaction){
        self.transaction = transaction;
            
        tableView.dataSource = self;
        tableView.delegate = self;
//        tableView.tableFooterView = UIView();
        tableView.rowHeight = UITableViewAutomaticDimension
        tableView.estimatedRowHeight = 200;
        DataStore.get().addListener(listener: chatMessageSentListener, forEvent: "chat_message_sent", key: "ChatBoxCell");
        tableView.tableViewScrollToBottom(animated: false);
        self.tableView.separatorStyle = .none
    }
    
//    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
//        let messageCell = tableView.cellForRow(at: indexPath) as! MessageCell;
//        messageCell.sentTimeLabel.text = messageCell.message?.time_sent.timeLeft();
//    }
//    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        print("numberOfMessages:");
        return 0;
//       print(self.transaction?.conversation.getNumberOfMessages());
//        return (self.transaction?.conversation.getNumberOfMessages())!;
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let message = Message(text: "", to_user_id: "", time_sent: nil)
        let cell = tableView.dequeueReusableCell(withIdentifier: "MessageCell") as! MessageCell;
        cell.setMessage(message: message);
        return cell;
    }
    
    func chatMessageSentListener(data: Any){
        print("chatMessageSentListener triggered in TransactionViewController")
        let data = data as! Dictionary<String, Any>
        let transaction_id = data["transaction_id"] as! String
        let message = data["message"] as! Dictionary<String, Any>;
        if(self.transaction?._id == transaction_id){
            self.transaction?.sendChatMessage(message: Message(dictionary:message))
        }
        tableView.reloadData();
        tableView.tableViewScrollToBottom(animated: true);
        
    }
}

extension UITableView {
    
    func tableViewScrollToBottom(animated: Bool) {
        
        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(100)) {
            let numberOfSections = self.numberOfSections
            let numberOfRows = self.numberOfRows(inSection: numberOfSections-1)
            if numberOfRows > 0 {
                let indexPath = IndexPath(row: numberOfRows-1, section: (numberOfSections-1))
                self.scrollToRow(at: indexPath, at: UITableViewScrollPosition.bottom, animated: animated)
            }
            let scrollPoint = CGPoint(x: 0, y: self.contentSize.height - self.frame.size.height)
            self.setContentOffset(scrollPoint, animated: true)

        }
    }
}
