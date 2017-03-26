'use strict';

$(document).ready(function() {

    // //inject angular file upload directives and services.
    // var app = angular.module('fileUpload', ['ngFileUpload']);
    //
    // app.controller('MyCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    //     $scope.uploadPic = function(file) {
    //         file.upload = Upload.upload({
    //             url:'/v1/user/uploads',
    //             method: 'POST',
    //             data: {
    //                 title: $scope.title,
    //                 description: $scope.description,
    //                 price: $scope.price,
    //                 vunetid: $scope.vunetid,
    //                 tag: $scope.tag,
    //                 file: file,
    //             },
    //         });
    //
    //         file.upload.then(function (response) {
    //             $timeout(function () {
    //                 file.result = response.data;
    //             });
    //         }, function (response) {
    //             if (response.status > 0)
    //                 $scope.errorMsg = response.status + ': ' + response.data;
    //         }, function (evt) {
    //             // Math.min is to fix IE which reports 200% sometimes
    //             file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
    //         });
    //     }
    // }]);

        // $('form').submit(function(e) {
        //     e.preventDefault();
        //
        //     // http://stackoverflow.com/questions/1184624/convert-form-data-to-javascript-object-with-jquery
        //     const formData = {};
        //     $(e.target).serializeArray().map(function(x){formData[x.name] = x.value;});
        //
        //     var today = new Date();
        //     formData.startDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        //     console.log(formData);
        //
        //     $.post('/v1/user/'+ formData.vunetid, formData)
        //         .done((result) => {
        //             console.log("Ajax called successful new post");
        //             window.location = 'listings.html';
        //             // localStorage.setItem('username', result.username);
        //             // localStorage.setItem('email', result.primary_email);
        //         })
        //         .fail((err) => {
        //             alert('New post failed');
        //             // localStorage.clear();
        //             console.error(err);
        //         });
        //
        // });
});

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
                    file: file,
            },
        });

        file.upload.then(function (response) {
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

