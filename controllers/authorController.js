const Author = require("../associations").model("Author");
const Book = require("../associations").model("Book");
const asyncHandler = require("express-async-handler");
const debug = require("debug")("author")
const {body, validationResult} = require("express-validator")

const validateFirstName = () => {
    return body("first_name")
        .trim().isLength({min: 1}).escape()
        .withMessage("First name must be specified.")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters.")
}
const validateFamilyName = () => {
    return body("family_name")
        .trim().isLength({min: 1}).escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters.")
}
const validateBirthDate = () => {
    return body("date_of_birth", "Invalid date of birth.")
        .optional({values: "falsy"}).isISO8601().toDate()
}
const validateDeathDate = () => {
    return body("date_of_death", "Invalid date of death.")
        .optional({values: "falsy"}).isISO8601().toDate()
}

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.findAll({
        order: [["family_name"]]
    })
    res.render("author_list", {
        title: "Author List",
        author_list: allAuthors,
    })
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
    const author = await Author.findByPk(req.params.id)
    if (author === null) {
        debug(`id not found on get detail: ${req.params.id}`)
        const err = new Error("Author not found")
        err.status = 404
        return next(err)
    }
    const allBooksByAuthor = await Book.findAll({
        include: [{
            model: Author,
            where: {id: req.params.id},
        }],
        attributes: ["title", "summary", "id"]
    })
    res.render("author_detail", {
        author: author,
        author_books: allBooksByAuthor,
    })
});

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
    res.render("author_form", {title: "Create Author"})
};

// Handle Author create on POST.
exports.author_create_post = [
    validateFirstName(),
    validateFamilyName(),
    validateBirthDate(),
    validateDeathDate(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const author = Author.build({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        })

        if (!errors.isEmpty()) {
            return res.render("author_form", {
                title: "Create Author",
                author: author,
                errors: errors.array(),
            })
        }

        await author.save()
        res.redirect(author.url)
    })

]

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
    const author = await Author.findByPk(req.params.id)
    if (author === null) return res.redirect("/catalog/authors")
    const allBooksByAuthor = await author.getBooks()

    res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor,
    })
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
    const author = await Author.findByPk(req.params.id)
    const allBooksByAuthor = await author.getBooks()

    if (allBooksByAuthor.length > 0) {
        return res.render("author_delete", {
            title: "Delete Author",
            author: author,
            author_books: allBooksByAuthor,
        })
    }

    await author.destroy()
    res.redirect("/catalog/authors")
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
    const author = await Author.findByPk(req.params.id)

    if (author===null){
        debug(`id not found on get update: ${req.params.id}`)
        const err = new Error("Author not found")
        err.status = 404
        return next(err)
    }

    res.render("author_form", {
        title: "Update Author",
        author: author,
    })
});

// Handle Author update on POST.
exports.author_update_post = [
    validateFirstName(),
    validateFamilyName(),
    validateBirthDate(),
    validateDeathDate(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const author = await Author.findByPk(req.params.id)

        if (!errors.isEmpty()) {
            return res.render("author_form", {
                title: "Update Author",
                author: author,
                errors: errors.array(),
            })
        }

        author.set({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        })
        await author.save()
        res.redirect(author.url)
    }),
]
