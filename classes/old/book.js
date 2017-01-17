module.exports = Book;


//this constructor is for data from isbndb.com
function Book(book){
    if(book.title != undefined){
        this.title = book.title;
    }
    if(book.author_data != undefined){
        var authors = [];
        for(var i=0; i<book.author_data.length; i++){
            var author = book.author_data[i]
            if(author != undefined && author.name != undefined){
                authors.push(author.name);
            }
        }
        this.authors = authors;
    }
    if(book.isbn10 != undefined){
        this.isbn10 = book.isbn10;
    }
    if(book.publisher_name != undefined){
        this.publisher_name = book.publisher_name;
    }
    if(book.isbn13 != undefined){
        this.isbn13 = book.isbn13;
    }
    
}

Book.prototype = {
    //TODO: add getters for username and email, note: password should never be gotten only used internally in a user object
    constructor: Book,
}