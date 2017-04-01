/**
 * Created by chris on 4/1/2017.
 */

var app = angular.module('viewPost', []);
app.controller('myCtrl', function($scope, $http) {
    //const username = getParameterByName('username');
    //const username = cplee;

    let url = '/v1/posts';
    const tag = getParameterByName('tag');
    //http://stackoverflow.com/questions/16376438/get-path-and-query-string-from-url-using-javascript
    const window_url = window.location.pathname + window.location.search;

    if(tag == 'books' || tag == 'furniture' || tag == 'clothing' || tag == 'electronics' || tag == 'services' || tag == 'other'){
        url = '/v1/posts/tag';
    }

    $http({
        method: 'GET',
        url: url,
        params: {tag: tag, window_url: window_url}
    }).then(function successCallback(response) {
        console.log(response);
        $scope.info = [];
        let arrayText;

        for(var i = response.data.length-1 ; i >= 0; i--){

            //DELETE ALL
//                $http({
//                    method: 'POST',
//                    url: '/v1/user/delete/' + response.data[i]._id,
//                    data: {_id: response.data[i]._id }
//                }).then(function sucessCallback(response){
//                    console.log("deleted");
//                });

            var arrayBuffer = response.data[i].img.data.data;
            var img = base64ArrayBuffer(arrayBuffer);
            resizeImage(img, i);

            arrayText = {
                Title: response.data[i].title,
                Description: response.data[i].description,
                Price: response.data[i].price,
                StartDate: response.data[i].startDate,
                myTag: response.data[i].tag,
                ID: response.data[i]._id,
                vuID: response.data[i].vunetid,
                num: i //keep track of which listing to post image to

            };
            console.log(arrayText);
            $scope.info.push(arrayText);
        }
        JSON.stringify($scope.info);
    }, function errorCallback(error) {
        console.log(error);
    });
});


//Converting function ArrayBuffer to Base64
//https://gist.github.com/jonleighton/958841
function base64ArrayBuffer(arrayBuffer) {
    var base64    = '';
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var bytes         = new Uint8Array(arrayBuffer);
    var byteLength    = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength    = byteLength - byteRemainder;

    var a, b, c, d;
    var chunk;

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 ;// 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048)   >> 12 ;// 258048   = (2^6 - 1) << 12
        c = (chunk & 4032)     >>  6 ;// 4032     = (2^6 - 1) << 6
        d = chunk & 63;               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2 ;// 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3)   << 4; // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008)  >>  4;// 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15)    <<  2; // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }


    return base64;
}

function resizeImage(imageSRC, i){
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    canvas.width = 250; // target width
    canvas.height = 200; // target height

    var image = new Image();
    image.src = "data:image/png; base64," + imageSRC;

    image.onload = function(e) {
        ctx.drawImage(image,
            0, 0, image.width, image.height,
            0, 0, canvas.width, canvas.height
        );
        // create a new base64 encoding
        var resampledImage = new Image();
        resampledImage.src = canvas.toDataURL();
        var id = "resampled" + i;
        document.getElementById(id).appendChild(resampledImage);
    };


}
