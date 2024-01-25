const Genre = require("../associations").model("Genre")
const Book = require("../associations").model("Book")
const Book_Genre = require("../associations").model("Book_Genre")
const asyncHandler = require("express-async-handler");
const {body, validationResult} = require("express-validator");
const {Op} = require("sequelize");

const validateName = () => {
    return body("name", "Genre name must contain at least 3 characters.")
        .trim().isLength({min: 3}).escape()
}

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.findAll({
        order: [["name"]]
    })
    res.render("genre_list", {
        title: "Genre List",
        genre_list: allGenres
    })
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
    // Get details of genre and all associated books
    const genre = await Genre.findByPk(req.params.id)
    if (genre === null) {
        const err = new Error("Genre not found")
        err.status = 404
        return next(err)
    }
    const booksInGenre = await Book_Genre.findAll({
        where: {GenreId: genre.id},
        include: {
            model: Book,
            attributes: ["title", "summary", "id"]
        },
        attributes: []
    })
    res.render('genre_detail', {
        title: "Genre Detail",
        genre: genre,
        genre_books: booksInGenre,
    })
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
    res.render("genre_form", {title: "Create Genre"})
}

// Handle Genre create on POST.
exports.genre_create_post = [
    validateName(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const genre = Genre.build({name: req.body.name})

        if (!errors.isEmpty()) {
            return res.render("genre_form", {
                title: "Create Genre",
                genre: genre,
                errors: errors.array(),
            })
        }

        const genreExists = await Genre.findOne({
            where: {
                name: {
                    [Op.iLike]: req.body.name
                }
            }
        })
        if (genreExists) return res.redirect(genreExists.url)

        await genre.save()
        return res.redirect(genre.url)
    })
]

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
    const genre = await Genre.findOne({
        include: [{
            model: Book,
            attributes: ["title", "summary", "id"]
        }],
        where: { id: req.params.id}
    })

    if (genre === null) res.redirect("/catalog/genres")

    res.render("genre_delete", {
        title: "Delete Genre",
        genre: genre,
    })
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
    const genre = await Genre.findOne({
        include: [{
            model: Book,
        }],
        where: { id: req.params.id}
    })

    if (genre.Books.length > 0){
        return res.render("genre_delete", {
            title: "Delete Genre",
            genre: genre,
        })
    }

    await genre.destroy()
    res.redirect("/catalog/genres")

});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
    const genre = await Genre.findByPk(req.params.id)

    if (genre===null){
        const err = new Error("Genre not found")
        err.status = 404
        return next(err)
    }

    res.render("genre_form", {
        title: "Update Genre",
        genre: genre
    })
});

// Handle Genre update on POST.
exports.genre_update_post = [
    validateName(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const genre = await Genre.findByPk(req.params.id)

        if (!errors.isEmpty()){
            return res.render("genre_form", {
                title: "Update Genre",
                genre: genre,
                errors: errors.array()
            })
        }

        const genreExists = await Genre.findOne({
            where: {
                name: {
                    [Op.iLike]: req.body.name
                }
            }
        })
        if (genreExists) return res.redirect(genreExists.url)

        genre.set({
            name: req.body.name
        })
        await genre.save()
        res.redirect(genre.url)
    }),
]

