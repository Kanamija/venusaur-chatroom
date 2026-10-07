import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
    roomId: {
        type: String,
        required: true,
    }, 
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    }
})