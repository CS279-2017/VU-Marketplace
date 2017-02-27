//
//  PictureViewController.swift
//  mealplanappiOS
//
//  Created by Bowen Jin on 11/26/16.
//  Copyright © 2016 Bowen Jin. All rights reserved.
//

import UIKit
import AVFoundation

protocol SelectPictureDelegate {
    func pictureSelected(picture: Picture);
}

protocol DeletePictureDelegate{
    func pictureDeleted(picture: Picture);
}

class PictureViewController: BaseController, UIImagePickerControllerDelegate, UINavigationControllerDelegate, UIScrollViewDelegate{
    
    enum PictureViewControllerType{
        case updateProfilePicture
        case updatePicture
        case addPictureToListing
        case makeListing
    }
    
    
    @IBOutlet weak var scrollView: UIScrollView!
    var picture:Picture?
    
    var type: PictureViewControllerType?
    
    var listing: Listing?
    
    var picture_id: String?
    
    var picture_index: Int?
    
    var delegate:SelectPictureDelegate?
    
    @IBOutlet weak var cancelButton: UIButton!
    @IBOutlet weak var doneButton: UIButton!
    @IBOutlet weak var pictureView: UIImageView!
    
    @IBOutlet weak var savePictureButton: UIButton!
    
    @IBOutlet weak var bottomNavigationBar: UINavigationBar!
    
    let imagePickerController = UIImagePickerController();

    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        doneButton.addTarget(self, action: #selector(doneButtonClicked(button:)), for: .touchUpInside)
        cancelButton.addTarget(self, action: #selector(cancelButtonClicked(button:)), for: .touchUpInside)
        imagePickerController.delegate = self;
        self.imagePickerController.allowsEditing = true
        
        pictureView.backgroundColor = UIColor.lightText
        pictureView.contentMode = .scaleAspectFit;
        
        
        scrollView.minimumZoomScale = 1.0
        scrollView.maximumZoomScale = 5.0;
        scrollView.delegate = self;
        scrollView.contentSize = self.pictureView.frame.size;
        
        bottomNavigationBar.alpha = 0;
        
        savePictureButton.addTarget(self, action: #selector(savePicture), for: .touchUpInside)
        
        if(self.type != nil && self.type == .updateProfilePicture){
            savePictureButton.setTitle("Save Picture", for: .normal)
        }
        else{
            savePictureButton.setTitle("Add Picture", for: .normal)
        }
        
        if(picture != nil){
            if let image = picture?.image{
                pictureView.image = image;
            }
        }
        else{
            
        }
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(false)
        
        let authorizationStatus = AVCaptureDevice.authorizationStatus(forMediaType: AVMediaTypeVideo)
        
        switch authorizationStatus {
        case .notDetermined:
            AVCaptureDevice.requestAccess(forMediaType: AVMediaTypeVideo) { granted in
                if granted {
                    print("access granted")
                }
                else {
                    print("access denied")
                }
            }
        case .authorized:
            print("Access authorized")
        case .denied, .restricted:
            AVCaptureDevice.requestAccess(forMediaType: AVMediaTypeVideo) { granted in
                if granted {
                    print("access granted")
                }
                else {
                    print("access denied")
                }
            }
        }
    }
    
    func setType(type: PictureViewControllerType){
        self.type = type;
    }
    
    func setPictureId(picture_id: String){
        self.picture_id = picture_id
    }
    
    func setPictureIndex(picture_index: Int){
        self.picture_index = picture_index;
    }
    
    func setListing(listing: Listing){
        self.listing = listing;
    }
    
    func selectFromAlbumButtonClicked(){
        if(DataStore.get().socket_connected){
            self.imagePickerController.sourceType = .photoLibrary
            self.present(self.imagePickerController, animated: true, completion: nil)
        }
        else{
            DataStore.get().error_handler(error: "Not connected to server, cannot upload picture")
        }
    }
    
    func takePictureButtonClicked(){
        if(DataStore.get().socket_connected){
            self.imagePickerController.sourceType = .camera
            self.present(self.imagePickerController, animated: true, completion: nil)
        }
        else{
            DataStore.get().error_handler(error: "Not connected to server, cannot upload picture")
        }
    }
    
    func doneButtonClicked(button: UIButton){
        showActionSheet();
    }
    
    func cancelButtonClicked(button: UIButton){
        self.dismiss(animated: true, completion: nil)
    }
    
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String : Any]) {
        if let pickedImage = info[UIImagePickerControllerEditedImage] as? UIImage {
            var picture = pickedImage;
            picture = UIImage(data: UIImageJPEGRepresentation(picture, DataStore.get().jpegCompressionRatio)!)!;
            pictureView.image = picture;
            bottomNavigationBar.alpha = 1;
            self.dismiss(animated: true, completion: nil)
        }
        else{
            print("imagePickerController failed");
        }
    }
    
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        self.dismiss(animated: true, completion: nil)
        
    }
    
    func viewForZooming(in scrollView: UIScrollView) -> UIView? {
        return self.pictureView;
    }
    
    func deletePicture(){
        if self.picture != nil{
            if(self.delegate is DeletePictureDelegate){
                if(self.type == .updateProfilePicture){
                    let picture_data = UIImageJPEGRepresentation(#imageLiteral(resourceName: "profile_pic"), 1.0)
                    DataStore.get().updateProfilePicture(user_id: (UserData.get()?.user_id!)!, password: (UserData.get()?.password!)!, profile_picture: picture_data!, callback: {
                        (self.delegate as! DeletePictureDelegate).pictureDeleted(picture: self.picture!);
                        self.hideProgressBar();
                        self.dismiss(animated: true, completion: nil)
                    }, error_handler: DataStore.get().error_handler)
                    self.showProgressBar(msg: "Deleting Picture", true, width: 200)
                }
                else{
                    (self.delegate as! DeletePictureDelegate).pictureDeleted(picture: self.picture!);
                    self.dismiss(animated: true, completion: nil)
                }
            }
            else{
                self.dismiss(animated: true, completion: nil)
            }
        }
        else{
            self.dismiss(animated: true, completion: nil)
        }

    }
    
    func savePicture(){
        func callback(){
            var picture = pictureView.image!;
            picture = UIImage(data: UIImageJPEGRepresentation(picture, DataStore.get().jpegCompressionRatio)!)!;
            let return_image = picture;
            let return_picture = Picture(image: return_image, picture_index: self.picture_index)
            return_picture._id = picture_id
            delegate?.pictureSelected(picture: return_picture)
            UserData.set(profile_picture: picture);
            self.dismiss(animated: true, completion: nil)
        }
        func sendPictureToServer(picture_data: Data){
            let user_id = UserData.get()?.user_id!
            let password = UserData.get()?.password!
            if(self.type == .updateProfilePicture){
                DataStore.get().updateProfilePicture(user_id: user_id!, password: password!, profile_picture: picture_data, callback: callback, error_handler: DataStore.get().error_handler)
                self.showProgressBar(msg: "Saving Picture", true, width: 200)
            }
            else{
                callback();
            }
        }
        
        let picture = pictureView.image;
        var picture_data = UIImageJPEGRepresentation(picture!, 1.0);
        print("picture size: " + String(picture_data!.count))

        if((picture_data?.count)! <= DataStore.get().maxPictureSize){
            sendPictureToServer(picture_data: picture_data!)
        }
        else{
            DataStore.get().error_handler(error: "Picture size too large!")
            print((picture_data?.count)!)
        }
        
    }
    
//    override var preferredStatusBarStyle: UIStatusBarStyle {
//        return .lightContent
//    }
    
    func showActionSheet(){
        let optionMenu = UIAlertController(title: nil, message: "Choose Option", preferredStyle: .actionSheet)
        
//        let saveAction = UIAlertAction(title: "Save Picture", style: .default, handler:
//            {
//                (alert: UIAlertAction!) -> Void in
//                if(self.pictureView.image != nil){
//                    self.savePicture(picture: self.pictureView.image!)
//                }
//                else{
//                    DataStore.get().error_handler(error: "You must select a picture")
//                }
//        })
        
        let deleteAction = UIAlertAction(title: "Delete Picture", style: .destructive, handler:
            {
                (alert: UIAlertAction!) -> Void in
//                let alertController = UIAlertController(title: "Are you sure you want to delete this picture?", message: "", preferredStyle: UIAlertControllerStyle.alert)
//                let terminateAction = UIAlertAction(title: "Delete Picture", style: UIAlertActionStyle.destructive) { (result : UIAlertAction) -> Void in
//                    self.deletePicture();
//                }
//                let cancelAction = UIAlertAction(title: "Cancel", style: UIAlertActionStyle.cancel) { (result : UIAlertAction) -> Void in
//                    
//                }
//                alertController.addAction(terminateAction)
//                alertController.addAction(cancelAction)
//                self.present(alertController, animated: true, completion: nil)
                self.deletePicture();
        })
        
        let selectFromAlbumAction = UIAlertAction(title: "Select a Picture From Album", style: .default, handler:
            {
                (alert: UIAlertAction!) -> Void in
                self.selectFromAlbumButtonClicked();
        })
        
        let takePictureAction = UIAlertAction(title: "Take Picture Using Camera", style: .default, handler:
            {
                (alert: UIAlertAction!) -> Void in
                self.takePictureButtonClicked();
                
        })
        
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler:
            {
                (alert: UIAlertAction!) -> Void in
//                self.dismiss(animated: true, completion: nil);
        })
//        optionMenu.addAction(saveAction)
        optionMenu.addAction(takePictureAction)
        optionMenu.addAction(selectFromAlbumAction);
        optionMenu.addAction(deleteAction)
        optionMenu.addAction(cancelAction)
        self.present(optionMenu, animated: true, completion: nil);
    }
    
}
