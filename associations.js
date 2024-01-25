const { Sequelize, DataTypes } = require('sequelize');
const { DateTime } = require("luxon")
const {populateDb} = require("./populatedb");
const dev_db_url = "postgresql://postgres:root@127.0.0.1:5433/local_library"
const postgresql = process.env.POSTGRESQLDB_URI || dev_db_url;
const sequelize = new Sequelize(postgresql);

const POPULATE_DB = false

async function connect(){
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
    console.log("Syncing tables...")
    if (POPULATE_DB){
        await sequelize.sync({ force: true })
        await populateDb(sequelize)
    } else {
        await sequelize.sync()
    }
}
connect().catch(error => console.log(error))

const Author = sequelize.define('Author', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    family_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    full_name: {
        type: DataTypes.VIRTUAL,
        get(){
            let fullName = ""
            if (this.first_name && this.family_name){
                fullName = `${this.family_name}, ${this.first_name}`
            }
            return  fullName
        }
    },
    date_of_birth: DataTypes.DATE,
    date_of_birth_formatted: {
        type: DataTypes.VIRTUAL,
        get(){
            return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : ''
        }
    },
    date_of_birth_yyyy_mm_dd: {
        type: DataTypes.VIRTUAL,
        get(){
            return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toFormat("yyyy-MM-dd") : ""
        }
    },
    date_of_death: DataTypes.DATE,
    date_of_death_formatted: {
        type: DataTypes.VIRTUAL,
        get(){
            return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : ''
        }
    },
    date_of_death_yyyy_mm_dd: {
        type: DataTypes.VIRTUAL,
        get(){
            return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toFormat("yyyy-MM-dd") : ""
        }
    },
    lifespan: {
        type: DataTypes.VIRTUAL,
        get(){
            let string = ""
            if (this.date_of_birth || this.date_of_death){
                string += "("
                if (this.date_of_birth){
                    string += "*"+this.date_of_birth_formatted
                }
                if (this.date_of_death){
                    string += ", †"+ this.date_of_death_formatted
                }
                string += ")"
            }
            return string
        }
    },
    url: {
        type: DataTypes.VIRTUAL,
        get(){
            return `/catalog/author/${this.id}`
        }
    }
});

const Book = sequelize.define('Book', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    summary: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    isbn: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.VIRTUAL,
        get(){
            return `/catalog/book/${this.id}`
        }
    },
});

const BookInstance = sequelize.define('BookInstance', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    imprint: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM,
        values: ["Available", "Maintenance", "Loaned", "Reserved"],
        allowNull: false,
        defaultValue: "Maintenance",
    },
    due_back: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    due_back_formatted: {
        type: DataTypes.VIRTUAL,
        get(){
            return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED)
        }
    },
    due_back_yyyy_mm_dd: {
        type: DataTypes.VIRTUAL,
        get(){
            return this.due_back ? DateTime.fromJSDate(this.due_back).toFormat("yyyy-MM-dd") : ""
        }
    },
    url: {
        type: DataTypes.VIRTUAL,
        get(){
            return `/catalog/bookinstance/${this.id}`
        }
    }
});

const Genre = sequelize.define('Genre', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            len: [3, 100]
        }
    },
    url: {
        type: DataTypes.VIRTUAL,
        get(){
            return `/catalog/genre/${this.id}`
        }
    }
});

Author.hasMany(Book)
Book.belongsTo(Author)

const Book_Genre = sequelize.define('Book_Genre', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    }
})

Book.belongsToMany(Genre, { through: "Book_Genre"})
Genre.belongsToMany(Book, { through: "Book_Genre"})
Book_Genre.belongsTo(Book)
Book_Genre.belongsTo(Genre)
Book.hasMany(Book_Genre)
Genre.hasMany(Book_Genre)

Book.hasMany(BookInstance)
BookInstance.belongsTo(Book)

module.exports = sequelize
