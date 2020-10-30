// DEPENDENCIES
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const methodOverride = require('method-override')
const multer = require('multer');
const cloudinary = require('cloudinary');
const upload = multer({ dest: './uploads/' });
const app = express()
const port = process.env.PORT || 5000


const mongoURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`
mongoose.set('useFindAndModify', false)   // Set MongoDB options


// EXPRESS SETUP
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(methodOverride('_method'))
app.use(express.urlencoded({
  extended: true
}))


// CONTROLLERS
const usersController = require('./controllers/UsersControllers')
const blogsController = require('./controllers/BlogsControllers')

// Import NPM session package
app.use(session({
    secret: process.env.SESSION_SECRET,
    name: "app_session",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 } // 3600000ms = 3600s = 60mins, cookie expires in an hour
  }))
  
  app.use(setUserVarMiddleware)

  

// ROUTES
// Main 
app.get('/blogs', loginOnlyMiddleware, blogsController.mainPage)


// User Registration and Login


app.get('/users/register', loginOnlyMiddleware, usersController.userRegistrationForm)
app.post('/users/register', loginOnlyMiddleware, usersController.register)

app.get('/users/login', loginOnlyMiddleware, usersController.userLoginPage)
app.post('/users/login', loginOnlyMiddleware, usersController.login)

app.post('/users/logout', authenticatorOnlyMiddleware, usersController.logout)


// // User dashboard
app.get('/blogs/dashboard', authenticatorOnlyMiddleware, usersController.dashboard)
app.get('/blogs/showall', authenticatorOnlyMiddleware, blogsController.showAllBlogs)
app.get('/blogs/showall/:category',authenticatorOnlyMiddleware, blogsController.showBlogsByCategory)



// New and create Blog Route
app.get('/blogs/new', authenticatorOnlyMiddleware, blogsController.newBlog)
app.post('/blogs', upload.array('myFile'), authenticatorOnlyMiddleware, blogsController.createNewBlog)



// Show Route
app.get('/blogs/:slug', authenticatorOnlyMiddleware, blogsController.showBlog)
app.get('/blogs/hashtag/:hashtag', authenticatorOnlyMiddleware, blogsController.hashtagPage)




// Edit and Update Routes
app.get('/blogs/edit/:slug', blogsController.editBlog)
app.patch('/blogs/:id', blogsController.updateBlog)

// Delete Route
app.delete('/blogs/:slug', authenticatorOnlyMiddleware, blogsController.deleteBlog)


// 



//  LISTENER
mongoose.connect( mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true } )
  .then(response =>{
    console.log('DB connection successful')

    app.listen(port, () => {
      console.log(`Blogs Post app listening on port: ${port}`)
    })
  })
  .catch(err => {
    console.log(err)
  })

function loginOnlyMiddleware(req, res, next) {

        // Check if user already loggin in, is yes redirect to dashboard
        if (req.session && req.session.user) {
        res.redirect('/blogs/dashboard')
        return
        }

        next()
}

function setUserVarMiddleware(req, res, next) {

        res.locals.user = null

        // check if req.session.user is set
        if (req.session && req.session.user) {
            res.locals.user = req.session.user
        }

next()
}

// Function to check if a user already logged in to the page, if not redirect to login page.
function authenticatorOnlyMiddleware(req, res, next) {
    if ( ! req.session || ! req.session.user ) {
      res.redirect('/users/login')
      return
    }

    next()
}