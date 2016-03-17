var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var validate = require('mongoose-validator');

mongoose.connect('mongodb://localhost/message_board');
app.use(bodyParser.urlencoded({extended: false}));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

var nameValidator = [
	validate({
		validator: 'isLength',
		arguments: [4, 50],
		message: 'Name should be between {ARGS[0]} and {ARGS[1]} characters' 
	})
]
var Schema = mongoose.Schema;
var MessageSchema = new mongoose.Schema({
	name: {type: String, required: true, validate: nameValidator},
	message: String,
	comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}]
});
var CommentSchema = new mongoose.Schema({
	_message: {type: Schema.Types.ObjectId, ref: 'Message'},
	name: {type: String, required: true, validate: nameValidator},
	comment: String,
	created_at: {type: Date, default: new Date}
});

MessageSchema.path('message').required(true, 'Message cannot be blank');
CommentSchema.path('comment').required(true, 'Comment cannot be blank');

mongoose.model('Message', MessageSchema);
mongoose.model('Comment', CommentSchema);
var Message = mongoose.model('Message');
var Comment = mongoose.model('Comment');

app.get('/', function(req, res){
	Message.find({}).populate('comments').exec(function(err, messages){
		res.render('index', {messages: messages});
	});
	
});

app.post('/message', function(req, res){
	console.log("Post Data" + req.body.name + req.body.message);
	var message = new Message({name: req.body.name, message: req.body.message});
	message.save(function(err){
		if(err){
			// console.log('Error saving message');
			var errors = message.errors;
			Message.find({}).populate('comments').exec(function(err, messages){
				res.render('index', {messages: messages, errors: errors});
			});
		} else{
			// console.log('Saved message');
			res.redirect('/');
		}
	});
});

app.post('/comment/:id', function(req, res){
	console.log("Comment Data" + req.body.name + req.body.comment + req.params.id);
	Message.findOne({_id: req.params.id}, function(err, message){
		var comment = new Comment(req.body);
		comment._message = message._id;
		message.comments.push(comment);
		comment.save(function(err){
			message.save(function(err){
				if(err){
					console.log('Error');
				} else{
					res.redirect('/');
				}
			});
		});		
	});
});

app.listen(8000, function(){
	console.log("Listening for chats on Port 8000");
})