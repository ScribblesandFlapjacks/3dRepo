var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var db = require('./db')
var credentials = require('./credentials.json');
var aws = require('aws-sdk');

app = express(),
port = process.env.PORT || 1337;

var URL = 'mongodb://test:test@ds037175.mongolab.com:37175/3drepo'


db.connect(URL, function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  } else {
    app.listen(port, function() {
      console.log('Listening on port '+ port + '...')
    })
  }
})

var AWS_ACCESS_KEY = credentials.access;
var AWS_SECRET_KEY = credentials.secret;
var S3_BUCKET = credentials.bucket;

app.use(express.static(__dirname + '/public'));

var passport = require('./src/session_manager')(app);

app.get("/files", function(req,res){
  var user = req.param('user');
  console.log(user);
  var collection = db.get().collection('users');
  var collection2 = db.get().collection('files');
  collection.find({user: user},{_id:0,permissions:1,owner:1}).toArray(function(err,docs){
    var owners = docs[0].owner;
    var permissions = docs[0].permissions;
    collection2.find({$or: [{fileId: {$in: owners}},{fileId: {$in: permissions}}]}).toArray(function(err2, docs2) {
      res.send(docs2)
    });
  });
});

app.post('/login', passport.authenticate('login', {
  successRedirect: '/home',
  failureRedirect: '/popsicle',
  failureFlash : true,
  session: true
}));

app.post('/register', passport.authenticate('register', {
  successRedirect: '/home',
  failureRedirect: '/poop',
  failureFlash : true,
  session: true
}));

app.get('/home', function (req, res) {
  if (!req.user) return res.redirect('/');
  return res.send("Hello " + req.user._id);
});

app.get('/register', function(req,res){
  res.sendfile('./public/register.html');
});

app.get("/signPut", function(req,res){
  var filename = req.param('filename');
  var filetype = req.param('filetype');
  aws.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});

  var s3 = new aws.S3();
  var options = {
    Bucket: S3_BUCKET,
    Key: filename,
    Expires: 60,
    ContentType: filetype,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', options, function(err, data){
    if(err) return res.send('Error with S3');

    res.json({
      signed_request: data,
      url: 'https://s3.amazonaws.com/' + S3_BUCKET + '/' + filename
    })
  })
});

app.get("/signGet", function(req,res){
  var filename = req.param('filename');
  var filetype = req.param('filetype');
  aws.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});

  var s3 = new aws.S3();
  var options = {
    Bucket: S3_BUCKET,
    Key: filename,
    Expires: 60
  };

  s3.getSignedUrl('getObject', options, function(err, data){
    if(err) return res.send('Error with S3');

    res.json({
      signed_request: data,
      url: 'https://s3.amazonaws.com/' + S3_BUCKET + '/' + filename
    })
  })
});

app.post("/upload", function(req,res){
  var user = req.param('user');
  var fileId = req.param('fileId');
  var size = req.param('size');
  var modelName = req.param('modelName');
  var modelDesc = req.param('modelDesc');
  var modelTags = req.param('modelTags');
  var collection = db.get().collection('files');
  collection.insert({fileId: fileId,owner: user, size: size, modelName: modelName, modelDesc: modelDesc, modelTags: modelTags, permissions:[] },function(err){
    if(err) return res.send(err);
    res.send();
  });
  var collection2 = db.get().collection('users');
  collection2.update({user: user}, {$push: {owner: fileId}})
});

app.post("/perm", function(req,res){
  var file = req.param('file');
  var user = req.param('user');
  console.log(file);
  console.log(user);
  var collection = db.get().collection('files');
  var collection2= db.get().collection('users');
  collection.update({fileId: file}, {$push: {permissions: user}}, function(err){
    if(err) return res.send(err);
    collection2.update({user: user},{$push: {permissions: file}}, function(err2){
      if(err2) return res.send(err2);
      res.send()
    })
  })
});

app.get('*', function(req,res){
  res.sendfile('./public/main.html');
});


