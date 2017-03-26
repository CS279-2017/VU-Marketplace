/**
 * Created by Githiora_Wamunyu on 3/13/2017.
 */
import Post from

function createNewPost() {

    let productName = $('#productName').val();
    let radioValue = $("input[name=optradio]:checked").val();
    let itemDescription = $('#TextArea').val();
    let price = $('#price').val();
    let deliveryMethod = $('#deliveryMethod').val();

    Post.title = productName
    Post
}
