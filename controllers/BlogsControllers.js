const UsersModel = require('../models/users')
const BlogsModel = require('../models/blogs')
const cloudinary = require('cloudinary')
const slugify = require('slugify')

const controllers = {

    mainPage: (req, res) => {
        res.render('blogs/index')
    },

    newBlog: (req, res) => {
        res.render('blogs/new', {
            pageTitle: "Create New Blog",
        })
    },

    createNewBlog: async (req, res) => {

        let inputString = req.body.hashtag
        if (inputString === ""){
            hashtagString = []
        }else {
            hashtagString = makeHashtag(inputString)
        }

        let localUser = req.session.user.username
        let todayDate = new Date()

        BlogsModel.create({
            title: req.body.title,
            creator: localUser,
            category: req.body.category,
            content: req.body.content,
            dateAdded: todayDate,
            address: [
                        {
                            addr_line_1: req.body.address1,
                            addr_line_2: req.body.address2,
                            city: req.body.city,
                            postal: req.body.postal,
                            country: req.body.country,
                            contact: req.body.contact
                        }
                        ],
            hashtag: hashtagString,
        })
            .then(result => {
                let filePaths = req.files
                let imgArr = []

                filePaths.forEach( (item, index) => {
                    cloudinary.uploader.upload(item.path, function(upload_res) {
                        let imgUrl = cloudinary.url(upload_res.public_id)
                        imgArr.push(imgUrl)

                        console.log(imgUrl)
                        BlogsModel.findOneAndUpdate(
                            { slug: result.slug },
                            { $push: { image: imgUrl }}  
                        )
                            .then(updateResult =>{
                                console.log(updateResult)
                                if (index === filePaths.length - 1){
                                    res.redirect('/blogs/' + result.slug)  
                                }
                            })
                            .catch(err =>{
                                console.log(err)
                            })
                    })
                    
                } )
                
            })
            .catch(err => {
                console.log(err)
                res.render('blogs/new')
            })
    },

    showBlog: (req, res) => {
        BlogsModel.findOne({
            slug: req.params.slug
        })
            .then(result => {
                if (!result) {
                    res.redirect('/blogs/dashboard')
                    return
                }

                res.render('blogs/show', {
                    pageTitle: result.title,
                    blog: result,
                    localUser: req.session.user
                })
            })
            .catch(err =>{
                console.log(err)
                res.redirect('/blogs/dashboard')
            })
            
    },

    hashtagPage: (req, res) => {
        
        let hashtag = "#" + req.params.hashtag

        BlogsModel.find( {
            // creator: req.session.user.email,
            hashtag: { $in: hashtag}
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
                        pageTitle: req.params.hashtag,
                        blogs: result,
                        display: "none",
                        localUser: req.session.user
                    })
            })
            .catch(err => {
                console.log(err)
                res.redirect('/blogs/dashboard')
            })
    },

    deleteBlog: (req, res) => {

        BlogsModel.findOne({
            slug: req.params.slug
        })
            .then(result => {
                BlogsModel.deleteOne({
                    slug: req.params.slug
                })
                .then(deleteResult => {
                    res.redirect('/blogs/dashboard')
                })
                .catch(err => {
                    console.log(err)
                    res.redirect('/blogs/dashboard')
                })
            })
            .catch(err => {
                console.log(err)
                res.redirect('/blogs/dashboard')
            })
    },

    editBlog: (req, res) => {

        BlogsModel.findOne({
            slug: req.params.slug
        })
            .then(result => {    
                res.render('blogs/edit', {
                    pageTitle: "Edit Blog for " + result.title,
                    blog: result,
                    address: result.address,
                    hashtags: result.hashtag,

                })   
            })
            .catch(err => {
                console.log(err)
                res.redirect('/blogs/dashboard')
            })
    },

    updateBlog: (req, res) => {

        let inputString = req.body.hashtag
        if (inputString === ""){
            hashtagString = []
        }else {
            hashtagString = makeHashtag(inputString)
        }

        BlogsModel.findById({
            _id: req.params.id
        })
            .then(result => {

                let newSlug = slugify(req.body.title, { lower: true, strict: true, unique: true })

                BlogsModel.updateOne({
                    _id: req.params.id
                },
                {
                    title: req.body.title,
                    category: req.body.category,
                    content: req.body.content,
                    address: [
                                {
                                    addr_line_1: req.body.address1,
                                    addr_line_2: req.body.address2,
                                    city: req.body.city,
                                    postal: req.body.postal,
                                    country: req.body.country,
                                    contact: req.body.contact
                                }
                                ],
                    // image: req.body.myFile,
                    hashtag: hashtagString,
                    slug: newSlug
                })
                    .then(updateResult => {
                        res.redirect('/blogs/' + newSlug)
                    })
                    .catch(err => {
                        console.log(err)
                        res.redirect('/blogs/dashboard')
                    })
            })
            .catch(err => {
                console.log(err)
                res.redirect('/blogs/dashboard')
            })
    },

    showAllBlogs: (req, res) => {

        BlogsModel.find()
            .then(result => {

                if (!result) {
                    res.redirect('/users/dashboard')
                    return
                }

                res.render('blogs/allblogs', {
                    pageTitle: "All Blogs Posted",
                    blogs: result,
                    hashtags: result.hashtag,
                    localUser: req.session.user,
                })
            })
            .catch(err => {
                console.log(err)
                res.redirect('/blogs/dashboard')
            })
    },

    showBlogsByCategory: (req, res) => {

        BlogsModel.find( {
            category: req.params.category
        })
            .then(result => {
                res.render('blogs/allblogs', {
                    pageTitle: req.params.category,
                    blogs: result,
                    localUser: req.session.user
                })
            })
            .catch(err => {
                console.log(err)
                res.redirect('/blogs/dashboard')
            })
    },

}


function makeHashtag(inputString){

    let splitString = inputString.split(',')
    let hashtagArr = []

    splitString.forEach(element =>{
        let removeFunnyChar = element.replace(/[^a-zA-Z ]/g, "")
        let wordArray = removeFunnyChar.split(' ').filter(char => char !== "")
        let result = '#'
        result = result + wordArray.join('')
        hashtagArr.push(result)
    })

    return hashtagArr
}

module.exports = controllers
