#! /usr/bin/env node

const {Op} = require("sequelize");

exports.populateDb = async (sequelizeInstance) => {
    const Book = sequelizeInstance.model("Book")
    const Author = sequelizeInstance.model("Author")
    const Genre = sequelizeInstance.model("Genre")
    const BookInstance = sequelizeInstance.model("BookInstance")
    await Genre.bulkCreate([
        {
            name: "Fantasy",
        },
        {
            name: "Science Fiction",
        },
        {
            name: "French Poetry",
        },
    ])
    await Author.bulkCreate([
        {
            first_name: "Patrick",
            family_name: "Rothfuss",
            date_of_birth: "1973-06-06",
        },
        {
            first_name: "Ben",
            family_name: "Bova",
            date_of_birth: "1932-11-07",
        },
        {
            first_name: "Isaac",
            family_name: "Asimov",
            date_of_birth: "1920-01-02",
            date_of_death: "1992-04-06",
        },
        {
            first_name: "Bob",
            family_name: "Billings",
        },
        {
            first_name: "Jim",
            family_name: "Jones",
            date_of_birth: "1971-12-16",
        },
    ])
    await Book.bulkCreate([
        {
            title: "The Name of the Wind (The Kingkiller Chronicle, #1)",
            summary: "I have stolen princesses back from sleeping barrow kings. I burned down the town of Trebon. I have spent the night with Felurian and left with both my sanity and my life. I was expelled from the University at a younger age than most people are allowed in. I tread paths by moonlight that others fear to speak of during day. I have talked to Gods, loved women, and written songs that make the minstrels weep.",
            isbn: "9781473211896",
            // author 0 genre 0
        },
        {
            title: "The Wise Man's Fear (The Kingkiller Chronicle, #2)",
            summary: "Picking up the tale of Kvothe Kingkiller once again, we follow him into exile, into political intrigue, courtship, adventure, love and magic... and further along the path that has turned Kvothe, the mightiest magician of his age, a legend in his own time, into Kote, the unassuming pub landlord.",
            isbn: "9788401352836",
            // author 0 genre 0
        },
        {
            title: "The Slow Regard of Silent Things (Kingkiller Chronicle)",
            summary: "Deep below the University, there is a dark place. Few people know of it: a broken web of ancient passageways and abandoned rooms. A young woman lives there, tucked among the sprawling tunnels of the Underthing, snug in the heart of this forgotten place.",
            isbn: "9780756411336",
            // author 0 genre 0
        },
        {
            title: "Apes and Angels",
            summary: "Humankind headed out to the stars not for conquest, nor exploration, nor even for curiosity. Humans went to the stars in a desperate crusade to save intelligent life wherever they found it. A wave of death is spreading through the Milky Way galaxy, an expanding sphere of lethal gamma ...",
            isbn: "9780765379528",
            // author 1 genre 1
        },
        {
            title: "Death Wave",
            summary: "In Ben Bova's previous novel New Earth, Jordan Kell led the first human mission beyond the solar system. They discovered the ruins of an ancient alien civilization. But one alien AI survived, and it revealed to Jordan Kell that an explosion in the black hole at the heart of the Milky Way galaxy has created a wave of deadly radiation, expanding out from the core toward Earth. Unless the human race acts to save itself, all life on Earth will be wiped out...",
            isbn: "9780765379504",
            //author 1 genre 1
        },
        {
            title: "Test Book 1",
            summary: "Summary of test book 1",
            isbn: "ISBN111111",
            //author 4 genre 0, 1
        },
        {
            title: "Test Book 2",
            summary: "Summary of test book 2",
            isbn: "ISBN222222",
            //author 4
        },
    ])
    await BookInstance.bulkCreate([
        {
            //book 0
            imprint: "London Gollancz, 2014.",
            status: "Available",
        },
        {
            //book 1
            imprint: " Gollancz, 2011.",
            status: "Loaned",
        },
        {
            //book 2
            imprint: " Gollancz, 2015.",
        },
        {
            //book 3
            imprint: "New York Tom Doherty Associates, 2016.",
            status: "Available",
        },
        {
            //book3
            imprint: "New York Tom Doherty Associates, 2016.",
            status: "Available",
        },
        {
            //book3
            imprint: "New York Tom Doherty Associates, 2016.",
            status: "Available",
        },
        {
            //book4
            imprint: "New York, NY Tom Doherty Associates, LLC, 2015.",
            status: "Available",
        },
        {
            //book4
            imprint: "New York, NY Tom Doherty Associates, LLC, 2015.",
            status: "Maintenance",
        },
        {
            //book4
            imprint: "New York, NY Tom Doherty Associates, LLC, 2015.",
            status: "Loaned",
        },
        {
            //book0
            imprint: "Imprint XXX2",
        },
        {
            //book1
            imprint: "Imprint XXX3",
        },
    ])
        .then(async () => {
            author = await Author.findOne({
                where: {
                    id: 1
                }
            })
            books = await Book.findAll({
                where: {
                    id: {
                        [Op.or]: [3, 4]
                    },
                }
            })
            await author.addBooks(books)
            const [genre1, genre2, book1, book2] = await Promise.all([
                await Genre.findByPk(1),
                await Genre.findByPk(2),
                await Book.findByPk(3),
                await Book.findByPk(4),
            ])
            await book1.addGenres([genre1, genre2])
            await book2.addGenres(genre2)
            const [bki1, bki2] = await Promise.all([
                await BookInstance.findByPk(1),
                await BookInstance.findByPk(2),
            ])
            await book1.addBookInstances([bki1, bki2])
            await book2.addBookInstances(bki1)
        })
}



