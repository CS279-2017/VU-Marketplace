//
//  RegisterUserDataController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/24/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//
import UIKit

class RegisterUserDataController: BaseController, UITextFieldDelegate, UIImagePickerControllerDelegate, UINavigationControllerDelegate, SelectPictureDelegate, DeletePictureDelegate{
    
    @IBOutlet weak var doneButton: UIButton!
    @IBOutlet weak var venmoIdTextField: UITextField!
    @IBOutlet weak var profilePictureView: UIImageView!
    
    let imagePickerController = UIImagePickerController();
    
    override func viewDidLoad() {
        super.viewDidLoad();
//        if(DataStore.get().getControllerWithIdentifier(identifier: "RegisterUserDataController") == nil){
            DataStore.get().addControllerWithIdentifier(identifier: "RegisterUserDataController", controller: self)
//        }
        venmoIdTextField.returnKeyType = .done;
        venmoIdTextField.delegate = self;
        venmoIdTextField.autocorrectionType = .no
        venmoIdTextField.autocapitalizationType = .none
        venmoIdTextField.spellCheckingType = .no
        
        imagePickerController.delegate = self;
        self.imagePickerController.allowsEditing = true
        
        let tap = UITapGestureRecognizer.init(target: self, action: #selector(profilePictureTapped));
        profilePictureView.addGestureRecognizer(tap);
        profilePictureView.isUserInteractionEnabled = true;
        
        doneButton.addTarget(self, action: #selector(doneButtonClicked(button:)), for: .touchUpInside)
        
    }
    
    
    func profilePictureTapped(){
        //do camera for this initial one, change it to photo album in the settings
        let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
        let controller : PictureViewController = storyBoard.instantiateViewController(withIdentifier: "PictureViewController") as! PictureViewController
        controller.delegate = self;
        controller.setType(type: .updateProfilePicture)
        controller.picture = Picture(image: self.profilePictureView.image, picture_id: nil)
        self.show(controller, sender: self);
    }
    
    func pictureSelected(picture: Picture) {
        profilePictureView.image = picture.image;
    }
    
    func pictureDeleted(picture: Picture) {
        profilePictureView.image = #imageLiteral(resourceName: "profile_pic");
    }
    
    func doneButtonClicked(button: UIButton){
        let topViewController = UIApplication.topViewController();
        if !(topViewController is MainController){
//            if let controller = DataStore.get().getControllerWithIdentifier(identifier: "MainController"){
//                controller.dismiss(animated: false, completion: nil);
//            }
//            let storyBoard : UIStoryboard = UIStoryboard(name: "Main", bundle: nil)
//            let controller : UIViewController = storyBoard.instantiateViewController(withIdentifier: "MainController") as! UITabBarController
//            topViewController?.show(controller, sender: topViewController)
            let appDelegate = UIApplication.shared.delegate as! AppDelegate
            appDelegate.window!.rootViewController?.dismiss(animated: false, completion: nil)
        }
    }
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.endEditing(true);
        doneButtonClicked(button: doneButton);
        return false;
    }
    
    func textFieldDidEndEditing(_ textField: UITextField) {
        if(textField == venmoIdTextField){
            func callback(updated_venmo_id:String){
                UserData.set(venmo_id: updated_venmo_id)
                print("venmo id" + updated_venmo_id + " sent to server")
            }
            DataStore.get().updateVenmoId(venmo_id: textField.text!, callback: callback, error_handler: self.error_handler)
        }
    }
    
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String : Any]) {
        if let pickedImage = info[UIImagePickerControllerEditedImage] as? UIImage {
            if let profile_picture_data = UIImagePNGRepresentation(pickedImage){
                profilePictureView.contentMode = .scaleAspectFit;
                profilePictureView.image = pickedImage;
//                UserData.set(profile_picture: pickedImage);
                
                let user_id = UserData.get()?.user_id!;
                let password = UserData.get()?.password!;
                func callback(){
                    print("updateProfilePicture successful!")
                    UserData.set(profile_picture: pickedImage);
                }
                DataStore.get().updateProfilePicture(user_id: user_id!, password: password!, profile_picture: profile_picture_data, callback: callback, error_handler: self.error_handler)
                
                self.dismiss(animated: true, completion: nil)
            }
        }
        else{
            print("imagePickerController failed");
        }
    }
    
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        dismiss(animated: true, completion: nil)
    }
    
    func error_handler(error: String){
        let alertController = UIAlertController(title: "Error", message: error, preferredStyle: UIAlertControllerStyle.alert)
        let okAction = UIAlertAction(title: "Ok", style: UIAlertActionStyle.default) { (result : UIAlertAction) -> Void in
        }
        alertController.addAction(okAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
    
}
