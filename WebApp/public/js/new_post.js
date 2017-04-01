'use strict';


//inject angular file upload directives and services.
var app = angular.module('fileUpload', ['ngFileUpload']);

app.controller('MyCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.uploadPic = function(file) {
        file.upload = Upload.upload({
            url:'/v1/user/' + $scope.vunetid,
            method: 'POST',
            data: {
                    title: $scope.title,
                    description: $scope.description,
                    price: $scope.price,
                    vunetid: $scope.vunetid,
                    tag: $scope.tag,
                    startDate: "",
                    img: {data: "", contentType: ""},
                    file: file,
            },
        });

        file.upload.then(function (response) {
            window.location = 'listings.html';
            $timeout(function () {
                file.result = response.data;
            });
        }, function (response) {
            if (response.status > 0)
                $scope.errorMsg = response.status + ': ' + response.data;
        }, function (evt) {
            // Math.min is to fix IE which reports 200% sometimes
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        });
    }

}]);


// /**
//  * Created by Githiora_Wamunyu on 3/13/2017.
//  */
// import Post from
//
// function createNewPost() {
//
//     let productName = $('#productName').val();
//     let radioValue = $("input[name=optradio]:checked").val();
//     let itemDescription = $('#TextArea').val();
//     let price = $('#price').val();
//     let deliveryMethod = $('#deliveryMethod').val();
//
//     Post.title = productName
//     Post
// }

