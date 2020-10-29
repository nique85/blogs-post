const uuid = require('uuid')
const SHA256 = require("crypto-js/sha256")
const UsersModel = require('../models/users')
const BlogsModel = require('../models/blogs')

const controllers = {

    userRegistrationForm: (req, res) => {

        // Show new user registration form page
        res.render('users/register', {
            pageTitle: "Let's get started"
        })
    },

    register: (req, res) => {

        // Validate user input

        // Find username or email address exist in MongoDB, if yes redirect to registration page
        UsersModel.findOne( 
            {
                $or: [
                        {
                            username: req.body.username
                        },
                        {
                            email: req.body.email
                        }
                ]
   
            }
        )
             .then(result => {
                 if (result) { 
                     res.redirect('/users/register')
                     return
                 }

                // Username or email not found in DB, proceed to register user
                // generate UUID as salt and combine with password
                const salt = uuid.v4()
                const combinePw = salt + req.body.password
                const hash = SHA256(combinePw).toString()

                UsersModel.create( {
                    username: req.body.username,
                    full_name: req.body.fullname,
                    email: req.body.email,
                    pwsalt: salt,
                    hash: hash 
                } )
                    .then(createResult => {
                        res.redirect('/users/login')
                    })
                    .catch(err => {
                        res.redirect('/users/register')
                    })
            })
            .catch(err => {
                console.log(err)
                res.redirect('/users/register')
            })
        
    },

    userLoginPage: (req, res) => {

        // Show login page
        res.render('users/login', {
            pageTitle: "Log in to your account",
            message: ""
        })
    },

    login: (req, res) => {
        // valid user input 

        // Search user account by username or email
        UsersModel.findOne( {
            $or: [
                {
                    username: req.body.login
                },
                {
                    email: req.body.login
                }
        ]
        } )
            .then(result =>{
                if (!result) {
                    res.redirect('/users/login', {
                        pageTitle: "Log in to your account",
                        message: "Invalid username or email"
                    })
                    return
                }

                const combinePw = result.pwsalt + req.body.password
                const hash = SHA256(combinePw).toString()

                // check if password is correct by comparing hashes
                if (hash !== result.hash) {
                    res.redirect('/users/login', {
                        pageTitle: "Log in to your account",
                        message: "Invalid password"
                    })
                    return
                }

                // Login successful , set session user
                req.session.user = result
                res.redirect('/blogs/dashboard')
            })
            .catch(err => {
                console.log(err)
                res.redirect('/users/login')
            })

    },

    dashboard: (req, res) => {
        let userID = req.session.user.email

        BlogsModel.find( {
            creator: userID
            
        } )
            .sort({
                dateAdded: 'desc'
            })

            .then(result => {
                if (!result) {
                    res.redirect('/users/login')
                    return
                }

                res.render('blogs/dashboard', 
                    {
                        pageTitle: "Blogs Posted",
                        blogs: result,
                        display: "none",
                        localUser: req.session.user
                    })
            })
            .catch(err => {
                res.send(err)
            })
    },

    logout: (req, res) =>{
        req.session.destroy()
        res.redirect('/users/login')
    }
}


module.exports = controllers