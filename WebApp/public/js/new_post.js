'use strict';


$(document).ready(function() {

    $('form').submit(function(e) {
        e.preventDefault();

        // http://stackoverflow.com/questions/1184624/convert-form-data-to-javascript-object-with-jquery
        const formData = {};
        $(e.target).serializeArray().map(function(x){formData[x.name] = x.value;});

        var today = new Date();
        formData.startDate = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        console.log(formData.startDate);

        $.post('/v1/user/'+ formData.vunetid, formData)
            .done((result) => {
                console.log("Ajax called successful new post");
                window.location = 'listings.html';
                // localStorage.setItem('username', result.username);
                // localStorage.setItem('email', result.primary_email);
            })
            .fail((err) => {
                alert('New post failed');
                // localStorage.clear();
                console.error(err);
            });

    });
});


//image
var app = angular.module('fileUpload', ['ngFileUpload']);

app.controller('MyCtrl', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.uploadFiles = function(files, errFiles) {
        $scope.files = files;
        $scope.errFiles = errFiles;
        angular.forEach(files, function(file) {
            file.upload = Upload.upload({
                url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
                data: {file: file}
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    file.result = response.data;
                });
            }, function (response) {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            }, function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                    evt.loaded / evt.total));
            });
        });
    }
}]);

