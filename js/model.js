//  define app for namespacing
var app = app || {};

// template fetching helper function in global namespace
var template = function(id){
	return _.template($("#" + id).html());
};

var ENTER_KEY = 13;

// Food Model
app.FoodItem = Backbone.Model.extend({

	initialize: function(attrs){

	},

	defaults: {

		item_name: '',

		item_id: 0,

		brand_name: '',

		nf_calories: 0,

		num_servings: 0,

	},

	validate: function(attrs){
		if (!attrs){
			return "Data missing!";
		}
	},

	parse: function(response){

		return response.fields; // parse one more time so .toJSON() works when making the food list
	}

});

// Declare food collection variable
app.FoodList = Backbone.Collection.extend({

	model: app.FoodItem,

	// sample API call for mcdonalds items, where the term mcdonalds is, is where I would allow the user to enter their query
	url: "https://api.nutritionix.com/v1_1/search/mcdonalds?results=0:10&fields=item_name,brand_name,item_id,nf_calories&appId=cd0bcc78&appKey=9aec12536b3cf72ef688e2489200ba31",

	initialize: function(){

		console.log("Collection Initialized");

	},

	parse: function(response){

		// returns JSON that's relevant
		return response.hits;
	}

});

//Firebase collection to be created
app.FoodDiary = Backbone.Firebase.Collection.extend({

	model: app.FoodItem,

	url: "https://fiery-fire-3787.firebaseio.com/",

	initialize: function(){

		console.log("Firebase Collection Initialized");

	},

	parse: function(response){
		console.log(response);
	}
});

app.SelectedFoodsList = new app.FoodDiary();


// Dom element for individual food items
app.FoodItemView = Backbone.View.extend({

	tagName: 'li',

	listTemplate: template("list-template"),

	// detailedTemplate: template("detailed-template"),

	initialize: function(options){

		this.bus = options.bus

	},

	events: {

		"click" : "onClick"

	},

	onClick: function(){

		console.log(this.model);
		this.bus.trigger("showDetailsOnFood", this.model);

	},

	render: function(){

		this.$el.html(this.listTemplate(this.model.toJSON()));

		return this;
	}

});


// iterate through foodlist
app.FoodListView = Backbone.View.extend({
	el: "#foods",

	tagName: "ul",

	initialize: function(options){

		this.bus = options.bus;

		this.collection.on('reset', this.render, this);

	},

	render: function(){
		var self = this;

		this.$el.empty(); // empty collection on new render

		self.collection.each(function(food){

			var renderedFood = new app.FoodItemView({model: food, bus: self.bus})

			self.$el.append(renderedFood.render().$el);

		});

		return this;
	}

});

// show food details, such as calories and food type, allow user to select how many servings they've had
app.FoodDetailsView = Backbone.View.extend({

	el: "#food-details",

	tagName: "div",

	detailedTemplate: template("detailed-template"),

	initialize: function(options){

		this.$input = this.$("#quantity");

		this.bus = options.bus;

		this.bus.on("showDetailsOnFood", this.onShowDetailsOnFood, this);

	},

	events: {

		"click .addFood" : "addToSelectedFoods",

		"keypress #quantity" : "updateQuantityEaten"

	},

	addToSelectedFoods : function(){

		console.log(this.model);

		app.SelectedFoodsList.add(this.model.attributes); // how can i parse this instead of manually selecting the attribtues

		console.log(app.SelectedFoodsList);

	},

	updateQuantityEaten: function(){ //update quantity of selected food eaten, so we can calculate calories


	},

	onShowDetailsOnFood: function(food){ // triggers bus event

		this.model = food; // this method only allows me to show one model at a time

		this.render();
	},

	render: function(){

		if (this.model){ // initially there is no model, the model is passed when the event is triggered

			this.$el.html(this.detailedTemplate(this.model.toJSON())); // renders the details of a food selected, and refreshes the view on new food selected

		}

		return this;
	}


});

app.bus = _.extend({}, Backbone.Events); // bus object instantiation, pass bus object to have reference to the data in each view

app.FoodDetailView = new app.FoodDetailsView({bus: app.bus})

// render each item in Food Diary
app.ShowFoodDiaryItem = Backbone.View.extend({

});
// view that shows total calories, servings and foods consumed
app.ShowFoodDiaryList = Backbone.View.extend({

	el:"#foods-journal",

	tagName: "ul",

});

// overall App view, this is helpful b/c events only look at decendants of "el"
app.AppView = Backbone.View.extend({

	el: ".healthapp",

	initialize: function(){
		app.foods = new app.FoodList(); // initialize collection of food

		app.foodListView = new app.FoodListView({collection: app.foods, bus: app.bus});

		this.$input = this.$("#search-bar"); // assign variable to jQuery selector for the search bar

	},

	events: {

		"keypress #search-bar": "searchOnEnter"

	},

	searchOnEnter: function(e){

		if (e.which === ENTER_KEY && this.$input.val().trim()){ // if enter key and there is a value in the search bar

			this.$inputURL = this.$input.val().replace(/ /g, "%20"); // replace spaces with %20 for the url

			this.userSearch = "https://api.nutritionix.com/v1_1/search/"+ this.$inputURL +"?results=0:10&fields=item_name,brand_name,item_id,nf_calories&appId=cd0bcc78&appKey=9aec12536b3cf72ef688e2489200ba31";

			app.foods.url = this.userSearch; // use 'this' or var? updates food collection's URL to user search input

			app.foods.fetch().then(function(){ // fetch new list

				app.foodListView.render();

			});

			this.$input.val(''); //clears input after Enter
		}
	}
});

app.AppView = new app.AppView();
