//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));

mongoose.connect("mongodb+srv://tintin_das:wrJPM26M58r9sgP@cluster0-yo7rn.mongodb.net/todolistDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});

// const today = new Date();
//
// const options = {
//   weekday: "long",
//   day: "numeric",
//   month: "long"
// }
//
// var day = today.toLocaleDateString("en-US", options);

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your new To Do list"
});

const item2 = new Item({
  name: "Hit the + button to add item"
});

const item3 = new Item({
  name: "<--- hit this to delete item"
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems) {

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Sucessfully added items.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          title: "Today",
          list: foundItems
        });
      }
    }
  );
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      } else{
        res.render("list", {title: customListName, list: foundList.items});
      }
    }


  });




});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;


  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today")
  {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Sucessfully deleted checked item");
      } else{
        console.log(err);
      }
    })

    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, result){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000.");
});
