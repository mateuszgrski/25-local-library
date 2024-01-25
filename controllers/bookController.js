const Book = require("../associations").model("Book")
const Author = require("../associations").model("Author")
const Genre = require("../associations").model("Genre")
const BookInstance = require("../associations").model("BookInstance")

const { body, validationResult } = require("express-validator")
const asyncHandler = require("express-async-handler");

const validateBookTitle = () => {
    return body("title", "Title must not be empty.")
        .trim().isLength({min: 1}).escape()
}

const validateAuthor = () => {
    return body("author", "Author must not be empty.")
        .trim().isLength({min: 1}).escape()
}

const validateSummary = () => {
    return body("summary", "Summary must not be empty.")
        .trim().isLength({min: 1}).escape()
}

const validateISBN = () => {
    return body("isbn", "ISBN must not be empty.")
        .trim().isLength({min: 1}).escape()
}

const validateGenre = () => {
    return body("genre.*", "Genre must be specified.").isLength({min: 1}).escape()
}



exports.index = asyncHandler(async (req, res, next) => {
    // Get details of books, book instances, authors and genre counts (in parallel)
const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
] = await Promise.all([
    Book.count(),
    BookInstance.count(),
    BookInstance.count({ where: { status: "Available"}}),
    Author.count(),
    Genre.count(),
])

    res.render("index", {
        title: "Local Library Home",
        book_count: numBooks,
        book_instance_count: numBookInstances,
        book_instance_available_count: numAvailableBookInstances,
        author_count: numAuthors,
        genre_count: numGenres,
    })
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.findAll({
        include: {
            model: Author,
            attributes: { include: ["first_name", "family_name"]},
        },
        attributes: ["title", "id"],
        order: [["title", "ASC"]],
    })
    res.render("book_list", { title: "Book List", book_list: allBooks})
});

// Display detail page for a specific Book.
exports.book_detail = asyncHandler(async (req, res, next) => {
    const book = await Book.findOne({
        where: { id: req.params.id },
        include: [{
            model: Author,
            attributes: [ "first_name", "family_name", "id"]
        }, Genre ],
    })
    if (book === null){
        const err = new Error("Book not found")
        err.status = 404
        return next(err)
    }
    const bookInstances =  await BookInstance.findAll({
        include: [{
            model: Book,
            where: {id: req.params.id}
        }],
    })
    res.render("book_detail", {
        title: book.title,
        book: book,
        book_instances: bookInstances,
    })
});

// Display Book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
    const [allAuthors, allGenres] = await Promise.all([
        await Author.findAll({order: [["family_name"]]}),
        await Genre.findAll({order: [["name"]]}),
    ])

    res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
    })
});

// Handle Book create on POST.
exports.book_create_post = [
    (req, res, next) => {
        req.body.genre = convertToArray(req.body.genre)
        next()
    },

    validateBookTitle(),
    validateAuthor(),
    validateSummary(),
    validateISBN(),
    validateGenre(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const bookData = {
            title: req.body.title,
            summary: req.body.summary,
            isbn: req.body.isbn,
            AuthorId: req.body.author,
        }
        const selectedGenreId = req.body.genre

        if (!errors.isEmpty()){
            const [allAuthors, allGenres] = await Promise.all([
                Author.findAll({order: [["family_name"]]}),
                Genre.findAll({order: [["name"]]}),
            ])

            allGenres.forEach((genre) => {
                if (selectedGenreId.length > 0 && selectedGenreId.includes(genre.id.toString())){
                    genre.checked = true
                }
            })

            return res.render("book_form", {
                title: "Create Book",
                authors: allAuthors,
                genres: allGenres,
                bookData: bookData,
                selectedGenreId: selectedGenreId,
                errors: errors.array()
            })
        }

        const book = await Book.create(bookData)
        await book.addGenres(selectedGenreId)
        res.redirect(book.url)
    })
]

// Display Book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
    const book = await  Book.findOne({
        where: { id: req.params.id},
        include: [Author, Genre],
    })
    if (book==null) return res.redirect("/catalog/books")
    const allBookInstances = await book.getBookInstances()

    res.render("book_delete", {
        title: "Delete Book",
        book: book,
        book_instances: allBookInstances,
    })
});

// Handle Book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
    const book = await Book.findByPk(req.params.id)
    const allBookInstances = await book.getBookInstances()

    if (allBookInstances.length > 0) {
        return res.render("book_delete", {
            title: "Delete Book",
            book: book,
            book_instances: allBookInstances,
        })
    }

    await book.destroy()
    res.redirect("/catalog/books")
});

// Display Book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
    const [book, allAuthors, allGenres] = await Promise.all([
        Book.findOne({
            include: [Author, Genre],
            where: {
                id: req.params.id
            }}),
        Author.findAll({
            order: [["family_name"]]
        }),
        Genre.findAll({
            order: [["name"]]
        }),
    ])

    if (book===null){
        const err = new Error("Book not found")
        err.status = 404
        return next(err)
    }

    const genres = await book.getGenres()
    const genreIDs = genres.map((genre) => genre.id)

    allGenres.forEach((genre) => {
        if (genreIDs.includes(genre.id)){
            genre.checked = true
        }
    })

    res.render("book_form", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres,
        bookData: book,
    })
});

// Handle Book update on POST.
exports.book_update_post = [
    (req, res, next) => {
        req.body.genre = convertToArray(req.body.genre)
        next()
    },

    validateBookTitle(),
    validateAuthor(),
    validateSummary(),
    validateISBN(),
    validateGenre(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const bookData = {
            title: req.body.title,
            summary: req.body.summary,
            isbn: req.body.isbn,
            AuthorId: req.body.author,
            id: req.params.id,
        }
        const selectedGenreId = req.body.genre

        if (!errors.isEmpty()){
            const [allAuthors, allGenres] = await Promise.all([
                Author.findAll({order: [["family_name"]]}),
                Genre.findAll({order: [["name"]]}),
            ])

            allGenres.forEach((genre) => {
                if (selectedGenreId.length > 0 && selectedGenreId.includes(genre.id.toString())){
                    genre.checked = true
                }
            })

            return res.render("book_form", {
                title: "Update Book",
                authors: allAuthors,
                genres: allGenres,
                bookData: bookData,
                selectedGenreId: selectedGenreId,
                errors: errors.array()
            })
        }


        const book = await Book.findByPk(bookData.id)
        book.set({
            title: bookData.title,
            summary: bookData.summary,
            isbn: bookData.isbn,
            AuthorId: bookData.AuthorId,
        })
        console.log(book)
        await book.save()
        await book.setGenres(selectedGenreId)
        res.redirect(book.url)
    })
]

const convertToArray = (val) => {
    if (!Array.isArray(val)) return typeof val === undefined ? [] : [val]
    return val
}
