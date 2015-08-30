var topLevelKeys = [
	"//",
	"target_path",
	"author_behavior",
	"committer_behavior",
	"collision_strategies",
	"files"
];
var collisionKeys = [
	"default",
	"branch_specific",
	"file_specific"
];
var collisionDefaultKeys = [
	"file",
	"branch",
	"branch_prefix",
	"branch_cleanup"
]
function splitConfigToJSON(config) {
	return JSON.stringify(recursivelyCopyObject(config,"root",function(sortHintKey, object) {
		if (sortHintKey == "root") {
			return topLevelKeys;
		}
		if (sortHintKey == "collision_strategies") {
			return collisionKeys;
		}
		if (sortHintKey == "default") {
			return collisionDefaultKeys;
		}
		if (isObject(object)) {
			return Object.keys(object).sort();
		}
		return object;
	}),null,'\t');
}

function splitConfigFactory(){
	return {
		target_path:null,
		author_behavior:"preserve",
		committer_behavior:"preserve",
		collision_strategies:{
			default:{
				file:"abort",
				branch:"prefix",
				branch_prefix:"git-split/",
				branch_cleanup:true
			},
			branch_specific:{
				"//":"This block configures overrides of the default.branch collision strategy.",
				"master":{
					"//":"master is assumed to exist (because usually it does, this tells the preflight not to worry if we use this branch)",
					branch: "ignore"
				}
			},
			file_specific:{
				"//":"If you want to override the default collision_strategy referenced above, do so here"
			}
		},
		files:[]
	}
}
function splitConfigDeleteSetFactory() {
	return {
		"//":"This file is a delete-set. The paths specified will be removed from your source repository.",
		delete_paths:[]
	}
}

var isObject = function(a) {
	return Object.prototype.toString.call(a) === "[object Object]";
}

var recursivelyCopyObject = function(object,sortHintKey,keySorter) {
	if (isObject(object)) {
		var newObj = new Object();
		var orderedKeys = keySorter(sortHintKey, object);
		console.log("Ordered",orderedKeys);
		for (var i = 0; i < orderedKeys.length; i++) {
			var key = orderedKeys[i];
			newObj[key] = recursivelyCopyObject(object[key],key,keySorter)
		}
		return newObj;
	} else if (Array.isArray(object)) {
		if (sortHintKey == "files") {
			object = object.sort();
		}
		return object.map(function(o){
			return recursivelyCopyObject(o,sortHintKey,keySorter);
		});
	} else {
		return object;
	}
}

module.exports = {
	splitConfigFactory:splitConfigFactory,
	splitConfigDeleteSetFactory:splitConfigDeleteSetFactory,
	
	splitConfigToJSON:splitConfigToJSON
}