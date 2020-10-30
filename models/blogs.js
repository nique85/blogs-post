const mongoose = require('mongoose')
const marked = require('marked')
const slugify = require('slugify')

const blogsSchema = new mongoose.Schema( {
    title: {    type: String, 
                required: true,
                max: 100
            },
    creator: { type: 'String', 
            required: true 
          },
    category: {
                type: String,
                required: true
    },
    content: {  
                type: String, 
                required: true,
                max: 1000
             },
    dateAdded: {    type: 'Date', 
                    required: true 
                },
    dateUpdated: {
                    type: Date,
                    required: true,
                    default: Date.now
    },
    address:[
                {
                    addr_line_1: String,  
                    addr_line_2: String,
                    city: String,
                    postal: String,
                    country: {  type: String,
                                required: true},
                    contact: String
                }
            ],
    image:  [String],
    hashtag: [ String ], 
    slug: {
        type: String,
        required: true,
        unique: true
    }
})

blogsSchema.pre('validate', function(next) {
    if (this.title) {
        this.slug = slugify(this.title, { lower: true, strict: true, unique: true })
    }

    next()
})


const BlogsModel = mongoose.model('Blog', blogsSchema)

module.exports = BlogsModel