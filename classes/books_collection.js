var Book = require("./book.js");

function BooksCollection(database){
    this.database = database;
    this.collection_books = database.collection('books');
}

BooksCollection.prototype = {
    constructor: BooksCollection,
    add: function(book, callback, error_handler){
        var collection_books = this.collection_books;
        if(book._id == undefined){
            this.collection_books.insert(book, function (err, count, status) {
                if(err){error_handler(err.book);}
                else{
                    collection_books.find(book).toArray(function(err, docs){
                        if(docs.length == 1){
                            book.update(docs[0]);
                            if(callback != undefined){ callback(book);}
                        }
                        else{
                            error_handler("more than 1 book inserted into database");
                            return;
                        }
                    });
                }
            });
        }
        else{
            error_handler("You cannot modify an existing book!");
        }
    },
    get: function(book_ids, callback, error_handler){
        if(!(Array.isArray(book_ids))){
            error_handler("book_ids must be an array!")
        }
        var book_id_arr = [];
        for(var i=0; i< book_ids.length; i++){
            book_id_arr.push(toMongoIdObject(book_ids[i].toString()));
        }
        this.collection_books.find({_id: {$in:book_id_arr}}).toArray(function(err, docs) {
            if(docs.length > 0){
                var books_arr = [];
                for(var j=0; j< docs.length; j++){
                    var book = new Book();
                    book.update(docs[j]);
                    books_arr.push(book);
                }
                callback(books_arr);
            }
            else{
                error_handler("No books were found");
            }
        });
    },
    getForEmailAddress: function(email_address, callback, error_handler){
        this.collection_books.find({email_address: email_address}).toArray(function(err, docs) {
            if(docs.length > 0) {
                var book = new Book()
                book.update(docs[0]);
                callback(book);
            }
            else{
                error_handler("Book with email_address " + email_address + " was not found");
            }
        });
    },
}

function toMongoIdObject(id){
    return new require('mongodb').ObjectID(id.toString());
}

module.exports = BooksCollection;