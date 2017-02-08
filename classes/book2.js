function Book(){

}

Book.prototype = {
    //TODO: add getters for username and email, note: password should never be gotten only used internally in a user object
    constructor: Book,
    initWithIsbnDb: function(book){
        if(book.title != undefined){
            this.title = book.title;
        }
        if(book.author_data != undefined){
            var authors = [];
            var author_names = "";
            for(var i=0; i<book.author_data.length; i++){
                var author = book.author_data[i]

                if(author != undefined && author.name != undefined){
                    authors.push(author.name);
                    if(author_names != ""){
                        author_names += "; "
                    }
                    author_names += author.name
                }
            }
            this.author_names = author_names;
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
    },
    initWithGoogleBooks: function(book){
        var volumeInfo = book.volumeInfo;
        var salesInfo = book.saleInfo;
        console.log(salesInfo);
        if(salesInfo["offers"] != undefined){
            console.log(salesInfo["offers"]);
        }
        // console.log(salesInfo.)
        if(volumeInfo != undefined){
            if(volumeInfo.title != undefined){
                this.title = volumeInfo.title;
            }
            if(volumeInfo.subtitle != undefined){
                this.subtitle = volumeInfo.subtitle;
            }
            if(volumeInfo.authors != undefined){
                var authors = volumeInfo.authors;
                var author_names = "";
                for(var i=0; i<authors.length; i++){
                    var author = authors[i];
                    if(author != undefined){
                        if(author_names != ""){
                            author_names += ", "
                        }
                        author_names += author
                    }
                }
                this.author_names = author_names;
                this.authors = authors;
            }
            if(volumeInfo.publisher != undefined){
                this.publisher_name = volumeInfo.publisher;
            }
            if(volumeInfo.publishedDate != undefined){
                this.date_published = volumeInfo.publishedDate;
            }
            if(volumeInfo.description != undefined){
                this.description = volumeInfo.description;
            }
            if(volumeInfo.industryIdentifiers != undefined){
                var industryIdentifiers = volumeInfo.industryIdentifiers;
                for(var i = 0; i< industryIdentifiers.length; i++){
                    var identifier = industryIdentifiers[i];
                    if(identifier.type == "ISBN_13"){
                        this.isbn13 = identifier.identifier;
                    }
                    if(identifier.type == "ISBN_10"){
                        this.isbn10 = identifier.identifier;
                    }
                }
            }
            if(volumeInfo.pageCount != undefined){
                this.page_count = volumeInfo.pageCount;
            }
            if(volumeInfo.imageLinks != undefined){
                if(volumeInfo.imageLinks.thumbnail != undefined){
                    this.image_url = volumeInfo.imageLinks.thumbnail;
                }
            }
        }
    }
}

module.exports = Book;
