const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const _ = require("lodash")


const app = express()

app.use(bodyParser.urlencoded({extended : true}))
app.set('view engine', 'ejs')
app.use(express.static("public"))


mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true })

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

const Item = mongoose.model("Item", itemSchema)

const item1 = new Item({
    name: "Welcome to Your To Do List!"
})

const item2 = new Item({
    name: "Hit the + button to add a new item"
})

const item3 = new Item({
    name: "Hit <-- to delete an item"
})

const defaultItems = [item1, item2, item3]


const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
})

const List = mongoose.model("List", listSchema)



app.get("/", function(req, res) {

    Item.find(function(err, items) {
        if(!err) {
            if(items.length === 0) {

                Item.insertMany(defaultItems, function(err) {
                    if(!err) {
                        console.log("Default items inserted successfully!");
                    }
                })

                res.redirect("/")
            }
            else {
                res.render("index", {listTitle : "Today", newListItems: items})
            }
        }
    })
})


app.get("/:customList", function(req, res) {

    List.findOne({name: _.capitalize(req.params.customList)}, function(err, customList) {
        if(!err) {
            if(customList) {
                res.render("index", {listTitle: customList.name, newListItems: customList.items})
            }
            else {
                const list = new List({
                    name: _.capitalize(req.params.customList),
                    items: []
                })

                list.save()

                res.render("index", {listTitle: list.name, newListItems: list.items})
            }
        }
    })
})


app.post("/", function(req, res) {

    const newItem = new Item({
        name: req.body.newItem
    })

    if(req.body.list === "Today") {
        newItem.save()
        res.redirect("/")
    }
    else {
        List.findOne({name: req.body.list}, function(err, customList) {
            if(!err) {
                customList.items.push(newItem)
                customList.save()
                res.redirect("/" + customList.name)
            }
        })
    }
})


app.post("/delete", function(req, res) {

    const listName = req.body.list
    const itemId = req.body.checkbox

    if(listName === "Today") {
        Item.deleteOne({_id: itemId}, function(err) {
            if(!err) {
                console.log("Deleted item successfully!");
            }
        })
    
        res.redirect("/")
    }
    else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, function(err) {
            if(!err) {
                console.log("Deleted item successfully!");
            }
        })

        res.redirect("/" + listName)
    }
})



app.get("/about", function(req, res) {
    res.render("about")
})



app.listen(3000, function() {
    console.log("Server is running on port 3000")
})