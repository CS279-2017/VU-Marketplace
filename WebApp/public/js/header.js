/**
 * Created by chris on 4/1/2017.
 */

function getListingByTag(tag){
    $.post('/v1/posts/tag', tag)
        .done((result) => {
            window.location = 'listings.html';
            localStorage.setItem('username', result.username);
            localStorage.setItem('email', result.primary_email);
        })
        .fail((err) => {
            alert('Could not authenticate user. Please try again.');
            localStorage.setItem('username', null);
            localStorage.setItem('email', null);
            console.error(err);
        });
}