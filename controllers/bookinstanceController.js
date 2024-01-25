const BookInstance = require("../associations").model("BookInstance");
const Book = require("../associations").model("Book")
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator")
const {DateTime} = require("luxon");

const validateBook = () => {
    return body("book", "Book must be specified").trim().isLength({min: 1}).escape()
}

const validateImprint = () => {
    return body("imprint", "Imprint must be specified").trim().isLength({min: 1}).escape()
}

const validateStatus = () => body("status").escape()

const validateDueBackDate = () => {
    return body("due_back","Invalid date").optional({values: "falsy"}).isISO8601().toDate()
}


// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.findAll({
        include: {
            model: Book,
        },
    })
    res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: allBookInstances,
    })
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findOne({
        include: [{
            model: Book,
        }],
        where: { id: req.params.id }
    })
    if (bookInstance === null) {
        const err = new Error("Book copy not found")
        err.status = 404
        return next(err)
    }
    res.render("bookinstance_detail", {
        bookinstance: bookInstance,
    })
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.findAll({
        attributes: ["title", "id"],
        order: [["title"]],
    })

    res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
    })
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    validateBook(),
    validateImprint(),
    validateStatus(),
    validateDueBackDate(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const bookInstanceData = {
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            BookId: +req.body.book,
        }

        if (!errors.isEmpty()){
            const allBooks = await Book.findAll({
                attributes: ["title", "id"],
                order: [["title"]],
            })

            bookInstanceData.due_back_yyyy_mm_dd =
                DateTime.fromJSDate(bookInstanceData.due_back).toFormat("yyyy-MM-dd").toString()

            return res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                bookinstance_data: bookInstanceData,
                errors: errors.array(),
            })
        }

        const bookInstance = await BookInstance.create(bookInstanceData)
        res.redirect(bookInstance.url)

    })
]

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findOne({
        include: [ Book ],
        where: { id: req.params.id}
    })

    if (bookInstance === null) res.redirect("/catalog/bookinstances")

    res.render("bookinstance_delete", {
        title: "Delete BookInstance",
        bookinstance: bookInstance,
    })
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findByPk(req.params.id)
    await bookInstance.destroy()
    res.redirect("/catalog/bookinstances")
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findByPk(req.params.id)
    const allBooks = await Book.findAll({
        attributes: ["title", "id"],
        order: [["title"]],
    })

    res.render("bookinstance_form", {
        title: "Update BookInstance",
        bookinstance_data: bookInstance,
        book_list: allBooks,
    })
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    validateBook(),
    validateImprint(),
    validateStatus(),
    validateDueBackDate(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const bookInstance = await BookInstance.findByPk(req.params.id)

        if (!errors.isEmpty()){
            const allBooks = await Book.findAll({
                attributes: ["title", "id"],
                order: [["title"]],
            })

            return res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                bookinstance_data: bookInstance,
                errors: errors.array(),
            })
        }

        bookInstance.set({
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            BookId: +req.body.book,
        })
        await bookInstance.save()
        res.redirect(bookInstance.url)

    })
]
