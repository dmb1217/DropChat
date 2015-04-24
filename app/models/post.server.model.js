'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Post Schema
 */
var PostSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Post name',
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	lat:{
        type: Number,
        default: 0,
        trim: true
    },
    lon:{
        type: Number,
        default: 0,
        trim: true
    },
    message:{
    	type: String,
    	default: ''
    }
});

mongoose.model('Post', PostSchema);