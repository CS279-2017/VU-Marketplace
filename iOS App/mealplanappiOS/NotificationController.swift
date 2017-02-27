//
//  NotificationController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 1/10/17.
//  Copyright © 2017 Bowen Jin. All rights reserved.
//

import UIKit


class NotificationController:BaseController,UITableViewDelegate, UITableViewDataSource{
    
    @IBOutlet weak var tableView: UITableView!
    
    var notifications = [Notification]()
    
    var refreshControl = UIRefreshControl();
    
    var users_dictionary = [String: User]();

    
    override func viewDidLoad() {
        tableView.delegate = self;
        tableView.dataSource = self;
        tableView.tableHeaderView = UIView();
        tableView.tableFooterView = UIView();
        
        tableView.rowHeight = UITableViewAutomaticDimension
        tableView.estimatedRowHeight = 40;
        
        if #available(iOS 10.0, *) {
            tableView.refreshControl = refreshControl
        } else {
            tableView.addSubview(refreshControl);
        };
        
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: UIControlEvents.valueChanged)

        
       
    }
    
    override func viewWillAppear(_ animated: Bool) {
        refreshControl.beginRefreshing();
        handleRefresh();
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if(notifications.count == 0){
            return 1
        }
        return notifications.count;
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if(notifications.count > 0){
            let notification = notifications[indexPath.row];

            if let listing_id = notification.listing_id{
                DataStore.get().getListing(listing_id: listing_id, callback: {listing in
                    let user = self.users_dictionary[notification.from_user_id!]
                    tableView.deselectRow(at: indexPath, animated: true);
                    DataStore.get().setNotificationAsViewed(notification_id: notification._id!, callback: {
                        notification.viewed = true;
                        self.updateDisplayedNotifications();
                        self.segueToChatViewController(selectedListing: listing, selectedUserId: notification.from_user_id!);
                    }, error_handler: DataStore.get().error_handler)
                }, error_handler: DataStore.get().error_handler)
            }
            else{
                DataStore.get().error_handler(error: "Notification has no listing_id");
            }
        }
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if(notifications.count == 0){
            let cell = tableView.dequeueReusableCell(withIdentifier: "LabelCell", for: indexPath) as! LabelCell
            cell.setLabel(text: "You Have No Notifications");
            cell.selectionStyle = .none;
            return cell;
        }
        let cell = tableView.dequeueReusableCell(withIdentifier: "NotificationCell", for: indexPath) as! NotificationCell
        let notification = notifications[indexPath.row];
        let user = users_dictionary[notification.from_user_id!];
        cell.set(notification: notification, user: user!);
        return cell;
    }
    
     func tableView(_ tableView: UITableView, editActionsForRowAt: IndexPath) -> [UITableViewRowAction]? {
        let delete = UITableViewRowAction(style: .normal, title: "Delete") { action, indexPath in
            let notification = self.notifications[indexPath.row];
            DataStore.get().deactivateNotification(notification_id: notification._id!, callback: { notification in
                self.notifications.remove(at: indexPath.row)
                tableView.deleteRows(at: [indexPath], with: .automatic)
            }, error_handler: DataStore.get().error_handler)
        }
        delete.backgroundColor = .red
        
        return [delete]
    }
    
    func handleRefresh(){
        loadNotifications(done: {self.refreshControl.endRefreshing()});
    }
    
    func loadNotifications(done: @escaping (()->Void)){
        func callback(notifications: [Notification]){
            self.notifications = notifications;
            self.notifications.sort(by: { $0.time_sent! > $1.time_sent! })
            var user_ids = [String]();
            for notification in notifications{
                user_ids.append(notification.from_user_id!)
            }
            if(user_ids.count > 0){
                DataStore.get().getUsers(user_ids: user_ids, callback: { users in
                    for user in users{
                        self.users_dictionary[user._id!] = user;
                    }
                    self.updateDisplayedNotifications();
                    done();
                }, error_handler: {error in
                    DataStore.get().error_handler(error: error);
                    done();
                })
            }
            else{
                done();
            }
        }
        if DataStore.get().socket_connected{
            DataStore.get().getNotifications(callback: callback, error_handler: { error in
                DataStore.get().error_handler(error: error);
                done();
            })
        }
        else{
            DataStore.get().error_handler(error: "Not connected to server");
            done();
        }
    }
    
    func updateDisplayedNotifications(){
        tableView.reloadData();
    }
    
//    func segueToChatViewController(selectedUser: User, selectedListing: Listing){
//        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//        let controller : ChatViewController = storyBoard.instantiateViewController(withIdentifier: "ChatViewController") as! ChatViewController
//        controller.set(listing: selectedListing, user: selectedUser);
//        self.present(controller, animated: true, completion: nil);
//    }
   
    
}
