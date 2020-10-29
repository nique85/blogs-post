const mongoose = require('mongoose')


const usersSchema = new mongoose.Schema({ 
    username: {
        type: String,
        required: true,
        unique: true,
        max: 50
    },
    full_name:{
        type: String,
        required: true,
        max: 100
    },
    email:{
        type: String,
        required: true,
        max: 100,
        unique: true
    },
    pwsalt: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    },
    updated_at: {
        type: Date,
        required: true,
        default: Date.now
    }

 })

 const UsersModel = mongoose.model('User', usersSchema)

 module.exports = UsersModel