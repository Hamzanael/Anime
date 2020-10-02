const express = require("express");
const bodyParser = require("body-parser");
const port = process.env.PORT;
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();

const Jikan = require('jikan-node');
const mal = new Jikan();


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({
    secret: "Welcome to the best web site",
    resave: false,
    saveUninitialized: false,
    expires: new Date(Date.now() + (30 * 86400 * 1000)) 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());

mongoose.connect('mongodb+srv://admin-hamza:nh19991128@cluster0.kj5ro.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    favorite: [],
    name: String,
    facebookId: String
},{ strict: false });

const AnimeReqSchema = new mongoose.Schema({
    animeID:String,
    animeLink:String
});

const AnimeName = mongoose.model(
    "Anime",
    new mongoose.Schema({
      title: String,
      discription : String,
      CoverImg:String,
      epNumbers:Number,
      EP: [],
      comments: [],
      category: []
    },{ strict: false })
  );
  const Category = mongoose.model(
    "Category",
    new mongoose.Schema({
      name: String,
      description: String,
      Animes:[],
    },{ strict: false })
  );
  const Comment = mongoose.model(
    "Comment",
    new mongoose.Schema({
      username: String,
      text: String,
      createdAt: String
    },{ strict: false })
  );
  
const EP = mongoose.model(
    "EP",
    new mongoose.Schema({
      title : String,
      epNumber : Number,
      imgLink : String,
      discribtion:String,
      server1:String,
      server2:String
    },{ strict: false })
  );    
UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

const User = new mongoose.model("user", UserSchema);
const AnimeReq=new mongoose.model("request",AnimeReqSchema);
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      console.log(`Error: ${error}`);
    });
});

passport.use(new GoogleStrategy({
        clientID: "648876845563-6uicnalrmoojavmlhdvepdd5u5fu34k0.apps.googleusercontent.com",
        clientSecret: "IwbiiLH3VrvIwWVUDD5TIDHm",
        callbackURL: "http://localhost:3000/auth/google/home",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
       

        User.findOrCreate({
            googleId: profile.id,
            username: profile.id,
            name: profile.displayName
        }, function (err, user) {
            return cb(err, user);
        });
    }
));




// Data Base Functions

const createUser = function (User) {
    return User.create(User).then(docUser => {
      
        return docUser;
    });
};


const createAnimeName = function (AnimeName) {
    return AnimeName.create(AnimeName).then(docAnimeName => {
       
        return docAnimeName;
    });
};

const createEP = function (AnimeNameId, EP) {

    return EP.create(EP).then(docEP => {
        
        return AnimeName.findByIdAndUpdate(
            AnimeNameId, {
                $push: {
                    EP: {
                        _id: docEP._id,
                        title: docEP.title,
                        epNumber: docEP.epNumber,
                        imgLink: docEP.imgLink,
                        discribtion: docEP.discribtion,
                        server1:docEP.server1,
                        server2:docEP.server2
                    }
                }
            }, {
                new: true,
                useFindAndModify: false
            }
        );
    });
};
const createComment = function (AnimeNameId, comment) {
    return Comment.create(comment).then(docComment => {
     

        return AnimeName.findByIdAndUpdate(
            AnimeNameId, {
                $push: {
                    comments:    {
                    username: docComment.username,
                    text: docComment.text,
                    createdAt: docComment.createdAt
                }
                }
            }, {
                new: true,
                useFindAndModify: false
            }
        );
    });
};




const getAnimeNameWithPopulate = function (id) {
    return AnimeName.findById(id)
        .populate("comments", "-_id -__v")
        .populate("category", "name -_id")
        .select("-images._id -__v");
};



app.route("/").
get(function (req, res) {

    

    var query =EP.find({}).sort({"_id":-1});
    var query2 = AnimeName.find({}).sort({"_id":-1});
    
    query.exec(function(err, ep) {
        if (!err) {
            query2.exec(function(err, anime) {
                if (!err) {
                   if(req.isAuthenticated()){
                    res.render("home", {
                        all: ep,
                        Animes: anime,
                        logged:true
                    });}else{
                        res.render("home", {
                            all: ep,
                            Animes: anime,
                            logged:false
                        });
                    }
             }
            });
            
     }
     }
     );





}).
post(function (req, res) {

});

app.post('/search', function(req, res) {
    var name = req.body.fltrname;
  
AnimeName.find({title:{ $regex: name, $options: "i" }},(err,found)=>{
    if(found){
       
        if(req.isAuthenticated()){
            res.render("animePages" , {Animes:found , logged:true} ); 
        }else{
            res.render("animePages" , {Animes:found , logged:false} ); 
        }
     
    }
    if(err){
        console.log(err);
    }

});

         
    
    
         } );


app.route('/userhome')

    .get(function (req, res) {
            if (req.isAuthenticated()) {
                User.findById(req.user.id, function (error, theUser) {

                    EP.find({}, function (err, founditems) {
                        if (err) {
                            console.log(err);
                        } else {
                            AnimeName.find({}, function (err, Animes) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    res.render("home", {
                                        all: founditems,
                                        Animes: Animes,
                                        userName: req.user.name,
                                        logged:true
                                    });
                                }
                            });

                        }


                    });
                });
            } else {

                res.redirect("/login");
            }


        }


    )
    .post(function (req, res) {

    });


app.get('/login', (req, res) => {
    res.render("login" , {wrong:false});
});

app.get('/loginfail', (req, res) => {
    res.render("login" , {wrong:true}); 	
});

app.post("/login", function(req, res){

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
  
    req.login(user, function(err){
      if (err) {
        console.log(err);
      } else {
        
        passport.authenticate("local" , { failureRedirect: '/loginfail' })(req, res, function(){
          res.redirect("/");
        });
      }
    });
  
  });
/*Google sign in*/

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    })


);

app.get('/auth/google/home',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.


        res.redirect("/");






    });



  //search
  
  app.get('/search_member', function(req, res) {
      
    var regex = new RegExp(req.query["term"], 'i');
    var query = AnimeName.find({title: regex}, { 'title': 1 }).sort({"updated_at":-1}).sort({"created_at":-1}).limit(20);
      
       // Execute query in a callback and return users list
   query.exec(function(err, aimes) {
       if (!err) {
          // Method to construct the json result set

          var result = JSON.stringify(aimes);
          res.send(result, {
             'Content-Type': 'application/json'
          }, 200);
       } else {
          res.send(JSON.stringify(err), {
             'Content-Type': 'application/json'
          }, 404);
       }
    });
 });


//comment 
app.post('/comment', (req, res) => {
    const comment=(req.body);
     
const newcomment = new Comment({
    username: comment.username,
    text: comment.text,
    createdAt:comment.createdAt
});
 createComment(comment.animeID,newcomment);
 



});
app.get('/comment', (req, res) => {
  
    
    AnimeName.findById(req.query.id,(err,found)=>{
        if(err){
            console.log(err);
            res.send(JSON.stringify(err), {
                'Content-Type': 'application/json'
             }, 404);
        }
        else{
           const lasstComment= found.comments[found.comments.length-1];
            var result = JSON.stringify(lasstComment);
            res.send(result, {
               'Content-Type': 'application/json'
            }, 200);
           
        }
    });


});

app.post('/saveAnime', (req, res) => {

    const newAnime= {
        title: req.body.title,
        discription : req.body.discription,
        CoverImg:req.body.CoverImg,
        epNumbers:req.body.epNumbers,
        category:req.body.catagory
    } ;	
    
    createAnimeName(newAnime);
res.redirect("/thegreatestadminpage");

});
//todo
app.get('/sortByCatagory', (req, res) => {
    const arr = ["action","comedy"]
AnimeName.find({category:arr},(err,found)=>{

}); 	
});

app.get('/Catagory/:cata', (req, res) => {
const cat=req.params.cata;
AnimeName.find({category:cat},(err,found)=>{
if(!err){
    if(req.isAuthenticated()){ 
    res.render("animePages" , {Animes:found , logged:true} ); }
    else{
        res.render("animePages" , {Animes:found , logged:false} );
    }

}
});	
});

app.post('/saveEP', (req, res) => {


    AnimeName.findOne({title:req.body.title},(err,found)=>{
        if(!err){
            const newEp = {
                title : req.body.title,
                epNumber : req.body.epNumber,
                imgLink : found.CoverImg,
                discribtion:req.body.discribtion,
                server1:req.body.server1,
                server2:req.body.server2
            };

            createEP(found._id,newEp);
        }

        res.redirect("/thegreatestadminpage");
    });
    

});

app.post('/editEP', (req, res) => {  
    const s1= req.body.server1;
    const s2= req.body.server2;
    const d=req.body.discribtion;
    var n=req.body.epNumber;
    var int = parseInt(n);      
        if(s1===""&&s2===""&&d==="" ){
            res.send("you didnt update any thing ");
        }
        if(s1!=""&&s2===""&&d==="" ){
            EP.findOneAndUpdate({title:req.body.title ,epNumber:n},{ $set: {server1 : s1 }},{useFindAndModify:false},(err,doc)=>{
                AnimeName.updateOne({'EP.epNumber': int}, {'$set': {
                    'EP.$.server1':s1,
                            }}, function(err,raw) {console.log(raw); });

                           
            });
           
        }
       if(s1==="" &&s2!="" &&d==="" ){
        EP.findOneAndUpdate({title:req.body.title ,epNumber:n},{ $set: {server2 : s2 }},{useFindAndModify:false},(err,doc)=>{
           AnimeName.updateOne({'EP.epNumber': int}, {'$set': {
    'EP.$.server2':s2,
            }}, function(err,raw) {console.log(raw); });
        });
        }
  
        if(s1==="" &&s2==="" &&d!="" ){
            EP.findOneAndUpdate({title:req.body.title ,epNumber:n},{ $set: {discribtion : d }},{useFindAndModify:false},(err,doc)=>{
                AnimeName.updateOne({'EP.epNumber': int}, {'$set': {
         'EP.$.discribtion':d,
                 }}, function(err,raw) {console.log(raw); });
             });
        }
        
        if(s1!="" &&s2!="" &&d==="" ){
            EP.findOneAndUpdate({title:req.body.title ,epNumber:n},{ $set: {server2 : s2,server1:s1 }},{useFindAndModify:false},(err,doc)=>{
                AnimeName.updateOne({'EP.epNumber': int}, {'$set': {
         'EP.$.server2':s2,
         'EP.$.server1':s1
                 }}, function(err,raw) {console.log(raw); });
             });
        }

        if(s1!="" &&s2==="" &&d!="" ){
            EP.findOneAndUpdate({title:req.body.title ,epNumber:n},{ $set: {discribtion : d,server1:s1 }},{useFindAndModify:false},(err,doc)=>{
                AnimeName.updateOne({'EP.epNumber': int}, {'$set': {
         'EP.$.discribtion':d,
         'EP.$.server1':s1
                 }}, function(err,raw) {console.log(raw); });
             });
        }

        if(s1==="" &&s2!="" &&d!="" ){
            EP.findOneAndUpdate({title:req.body.title ,epNumber:n},{ $set: {discribtion : d,server2:s2 }},{useFindAndModify:false},(err,doc)=>{
                AnimeName.updateOne({'EP.epNumber': int}, {'$set': {
         'EP.$.discribtion':d,
         'EP.$.server2':s2
                 }}, function(err,raw) {console.log(raw); });
             });
        }

        if(s1!="" &&s2!="" &&d!="" ){
            EP.findOneAndUpdate({title:req.body.title ,epNumber:n},{ $set: {discribtion : d,server1:s1 ,server2:s2}},{useFindAndModify:false},(err,doc)=>{
                AnimeName.updateOne({'EP.epNumber': int}, {'$set': {
         'EP.$.discribtion':d,
         'EP.$.server1':s1,
         'EP.$.server2':s2
                 }}, function(err,raw) {console.log(raw); });
             });
        }

       
 

  
    
});
app.post('/favorate', (req, res) => {
const fav = req.body;

var flag= true;

    User.findById(fav.user,(err,found)=>{
    for(var i =0;i<found.favorite.length;i++){
     const f=   found.favorite[i]._id;
       
     if(f==fav.anime){
           flag=false;
          
           AnimeName.findById(fav.anime,(err,anime)=>{
            User.findByIdAndUpdate(fav.user,{$pull:{favorite:anime}},{useFindAndModify:false},err=>{
              console.log(err);
                console.log("removed");
               
            });
        });
       }
    }

    if(flag){
        AnimeName.findById(fav.anime,(err,anime)=>{
            User.findByIdAndUpdate(fav.user,{$push:{favorite:anime}},{useFindAndModify:false},err=>{
                console.log(err);
              console.log("added");
              
            });
        });
    }
    

    });

    

	
});

app.get('/fava', (req, res) => {
    
    
    var result=false ;
    User.findById(req.query.id,(err,found)=>{
        for(var i =0;i<found.favorite.length;i++){
         const f=   found.favorite[i]._id;
         if(f==req.query.fava){
               result=true;
             return  res.send(result, {
                'Content-Type': 'application/json'
             }, 200);  
           }
        }
        console.log(result);
        res.send(result, {
            'Content-Type': 'application/json'
         }, 200);
    });
});
//toDo  

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});


app.get('/signup', (req, res) => {
    res.render("signUp",{wrong:false});
});

app.post('/signup', (req, res) => {
    User.register({
        username: req.body.username,name:req.body.name}, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.render("signUp",{wrong:true});
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });



});

app.get('/animePage', (req, res) => {
    AnimeName.find({},(err,found)=>{
        if(req.isAuthenticated()){
            res.render("animePages",{Animes:found,logged:true});
        }else{
            res.render("animePages",{Animes:found,logged:false});
        }
       
    });
   
});

app.get('/animePage/:title', (req, res) => {
const animeTitle= req.params.title;
    AnimeName.findOne({title:animeTitle},(err,found)=>{
        if(!err){

           if(req.isAuthenticated()){ 
            res.render("animePage",{Anime:found,logged:true,user:req.user.name,userID:req.user._id,favorate:req.user.favorite});}
            else {
                res.render("animePage",{Anime:found,logged:false});
            }
        }

    });

});
app.get('/epPgae/:title/:epNumber', (req, res) => {
const tit= req.params.title;
const num =parseInt( req.params.epNumber);

AnimeName.findOne(
    { title:tit} ,(err,found)=>{
        if(req.isAuthenticated()){
        res.render("epPage",{logged:true, ep:found.EP[num-1],Anime:found}); }
        else{
            res.render("epPage",{logged:false, ep:found.EP[num-1],Anime:found});
        }
    }
    ); 


});

app.post('/aplayForAnime', (req, res) => {
console.log(req.body);	
const animereq = AnimeReq({
    animeID:req.body.animeID,
    animeLink:req.body.animeLink
});
animereq.save();

});
app.post('/advincedsearch', (req, res) => {

     mal.search('anime', req.body.adv)
    .then(info => {
        
        res.render("advanced",{ Animes:info.results,})})
    .catch(err => console.log(err));	
   
   
});

app.get('/favorite', (req, res) => {
    if(req.isAuthenticated()){
    User.findById(req.user._id,(err,found)=>{
        res.render("favarate",{Animes:found.favorite,name:req.user.name})
    });}
    else{
        res.redirect("/login");
    }
    
});

app.get('/thegreatestadminpage', (req, res) => {
    res.render("admin"); 
		
});

app.get('/addAnimefortheadminsOnly', (req, res) => {

res.render("addAnime");
});

app.get('/addEPfortheadminsOnly', (req, res) => {
res.render("addEP"); 	
});

app.get('/editAnimefortheadminsOnly', (req, res) => {
res.render("editAnime");	
});
app.get('/deleteAnimefortheadminsOnly', (req, res) => {
res.render("/deletAnime");	
});
app.listen(port || 3000, function () {
    console.log("system is work on" + 3000);
});