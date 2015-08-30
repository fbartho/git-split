var async = require("async");
var fs = require("fs");
var git = require("nodegit");
var path = require("path")
var prompt = require("prompt");
var splitconfig = require("./splitconfig.js");
require("shelljs/global");

prompt.start();

function finishedPreparing(configs) {
	console.log("Done preparing",configs.length,"configs, examine them and call `git-split apply [--configs=…]`")
	for (var i = 0; i < configs.length; i++) {
		console.log("\t- "+configs[i][0]);
	}
}

function prepareAny(options) {
	console.log("Preparing",options)
	if (options.newconfigs) {
		options.configs = [];
	}
	var configs = [];
	if (options.configs.length) {
		// Passed in some configs
		var count = 0;
		for (var i = 0; i < options.configs.length; i++) {
			prepareSingle(options, options.configs[i],function(path,object) {
				if (path) {
					configs.push([path, object]);
				}
				count++;
				if (count >= configs.length) {
					askIfDeleteSetRequested(configs,finishedPreparing);
				}
			});
		}
	} else {
		// Brand new attempt!
		// How many splits?
		var splitCountSchema = {
			properties:{
				splitCount: {
					validator: /^[0-9]+$/,
					message: "How many split configs do you want to prepare?",
					default: 1,
					required: true
				}
			}
		};
		prompt.get(splitCountSchema,function(err, result){
			console.log("Result",result);
			var count = parseInt(result.splitCount, 10);
			var origCount = count;
			if (count > 10) {
				console.error("Too many split configs for sanity, try less than 10");
				exit(1);
				return;
			}
			// Setup a retry callback loop.
			var next = function() {
				count--;
				if (count < 0) {
					console.log("Done preparing",origCount,"split-configs!");
					askIfDeleteSetRequested(configs,finishedPreparing);
					return;
				}
				prepareSingle(options, null, function(path, object){
					if (path) {
						configs.push([path,object]);
					}
					next();
				})
			};
			next(); // execute
		});
	}
}

function prepareSingle(options, configPath, callback) {
	var config = splitconfig.splitConfigFactory();
	if (configPath && fs.existsSync(configPath)) {
		config = JSON.parse(fs.readFileSync(configPath));
	}
	if (configPath && !defaultTable.name) {
		config.name = path.basename(configPath,".splitconfig.json");
	}
	var schema = {
		properties:{
			name: {
				validator: function(val) {
					return /^[a-zA-Z_ -]+$/.test(val) && val.length < 20 && val.length > 1;
				},
				message: "Name your split-config",
				warning: "at least 1 character, less than 20 characters, used as a part of a filename.",
				default: config.name || "",
				required: true
			},
			target_path: {
				validator: function(val) {
					return val.length > 1 && (!fs.existsSync(val) || fs.lstatSync(path_string).isDirectory());
				},
				message: "Path to target repo",
				warning: "at least 1 character, path will be created if it does not exist, repo will be created if none exists, must be a directory if it does exist.",
				default: config.target_path || "",
				required: true
			},
			author_behavior: {
				validator: /^(preserve|overwrite)$/,
				message: "On author collision, what should happen? [preserve|overwrite]",
				default: config.author_behavior || "preserve",
				required: true
			},
			committer_behavior: {
				validator: /^(preserve|overwrite)$/,
				message: "On committer collision, what should happen? [preserve|overwrite]",
				default: config.committer_behavior || "preserve",
				required: true
			}
		}
	};
	prompt.get(schema,function (err, result) {
		if (err || !result) {
			console.error(err, "Couldn't get a result to basic splitconfig questions");
			exit(1);
		}
		var basicProps = {
			name:1,
			target_path:1,
			author_behavior:1
		};
		for (var k in basicProps) {
			config[k] = result[k];
		}
		
		var doneBlock = function(options, config){
			if (config) {
				var configPath = config.name + ".splitconfig.json";
				delete config.name;
				fs.writeFileSync(configPath, splitconfig.splitConfigToJSON(config));
				console.log("Wrote config to",configPath);
				callback(configPath, config);
			} else {
				callback(nil,nil);
			}
		};
		if ((config.files || []).length > 0) {
			askSelectFiles(options,config,doneBlock);
		} else {
			selectFiles(options,config,function(options,config) {
				askSelectFilesOrDone(options,config,doneBlock);
			});
		}
	});
}
function askSelectFilesOrDone(options, config, callback) {
	var property = {
	  name: 'choice',
	  message: "view file list, start file list all over, or done?",
	  validator: /v[iew]*|s[tart over]*|d[one]*/,
	  warning: 'Must respond `v/view`, `s/start over`, or `d/done`',
	  default: 'done'
	};
	prompt.get(property, function (err, result) {
		if (err) {
			console.log("");
			exit(1);
		}
		if (result.choice[0] == 'v') {
			console.log("Currently selected paths:");
			console.log((config.files||[]).join("\n\t"));
			askSelectFilesOrDone(options,config,callback);
		} else if (result.choice[0] == 'e') {
			selectFiles(options, config, callback);
		} else {
			callback(options, config);
		}
	});
}
function selectFiles(options, config, callback) {
	pushd(options.sourcerepo);
	var s = {
		silent:true
	};
	var tmp = exec("git ls-files",s);
	if (tmp.code != 0) {
		console.error("Source is not a repository!",options.sourcerepo);
		exit(1);
	} 
	popd();
	
	var tree = makeFileTree(tmp.output.split("\n"));
	// console.log("tree",tree);
	console.log("Source Parsed,",tree.allPaths().length,"tracked paths found.");
	
	config.files = [];
	selectFromNode(options,config,config.files,tree,function(){
		console.log("Finished picking",config.files.length,"paths.");
		callback(options,config);
	});
}
function selectFromNode(options, config, selectedPaths, node, callback) {

	var chooseNone = function(){
		async.setImmediate(callback);
	};
	var chooseUp = function() {
		async.setImmediate(function(){
			callback("go up");
		});
	};
	
	if (node.isDir) {
		// Directory options s/select-everything, +/some, n/none, u/up
		if (node.parent) {
			console.log("Analyzing directory:",node.path());
		} else {
			console.log("Analyzing repository:",options.sourcerepo);
		}
		
		var chooseEverything = function() {
			node.allPaths().forEach(function(p){
				selectedPaths.push(p);
				console.log("\tSelected:",p);
			});
			async.setImmediate(callback);
		};
		var chooseSome = function(){
			async.eachSeries(node.childrenList, function(item, next) {
				selectFromNode(options,config,selectedPaths,item,next);
			}, function(err) {
				async.setImmediate(callback);
			});
		}
		var schema = {
			properties: {
				choice: {
					validator: /^(s[electeverything\-]?)|(\+|some)|(n[one]?)|(u[p]?)$/,
					message: "Select all, some, none, or go up. [s/select-everything, +/some, n/none, u/up]",
					default: "some",
					required: true
				},
			}
		};
		prompt.get(schema,function(err,result) {
			if (err) {
				console.log("");
				exit(1);
			}
			var c = result.choice[0];
			if (c == 's' && result.choice != "some") {
				chooseEverything();
			} else if (c == '+' || result.choice == "some") {
				chooseSome();
			} else if (c == 'n') {
				chooseNone();
			} else {
				chooseUp();
			}
		});
	} else {
		// File options s/select, n/no, u/up
		console.log("Analyzing file:",node.path());
		var choose = function() {
			selectedPaths.push(node.path());
			async.setImmediate(callback);
		};

		var schema = {
			properties: {
				choice: {
					validator: /^(s[elect]?)|(n[o]?|skip)|(u[p]?)$/,
					message: "Select, no/skip, or go up. [s/select, n/no/skip, u/up]",
					default: "select",
					required: true
				},
			}
		};
		prompt.get(schema,function(err,result) {
			if (err) {
				console.log("");
				exit(1);
			}
			var c = result.choice[0];
			if (c == 's' && result.choice != "skip") {
				choose();
			} else if (c == 'n' || result.choice=="skip") {
				chooseNone();
			} else {
				chooseUp();
			}
		});
	}
	
}
function makeFileTree(arr) {
	var Node = function Node(name,parent) {
		this.parent = parent;
		this.name = name;
		this.isDir = false;
		this.children = {};
		this.childrenList = [];
	};
	Node.prototype.addPathParts = function(pathParts) {
		if (!pathParts.length) {
			return;
		}
		var n = pathParts[0];
		var remaining = pathParts.slice(1);
		if (n == "") {
			this.isDir = true;
			return;
		}
		
		if (!this.children.hasOwnProperty(n)) {
			this.isDir = true;
			this.children[n] = new Node(n,this);
			this.childrenList.push(this.children[n]);
		}
		this.children[n].addPathParts(remaining);
	};
	Node.prototype.pathParts = function() {
		// console.log("PathParts",this.name);
		var n = this;
		var parts = [];
		while (n && n.parent) {
			parts.unshift(n.name)
			n = n.parent;
		}
		return parts;
	};
	Node.prototype.path = function() {
		if (this.isDir) {
			return this.pathParts().join("/")+"/";
		}
		return this.pathParts().join("/");
	};
	Node.prototype.allPaths = function() {
		var paths = [];
		for (var i = 0; i < this.childrenList.length; i++) {
			var child = this.childrenList[i];
			if (child.isDir) {
				paths = paths.concat(child.allPaths());
			} else {
				paths.push(child.path());
			}
		}
		if (!paths.length) {
			paths.push(this.path());
		}
		return paths;
	};
	var t = new Node("*");
	arr.forEach(function(p){
		var parts = p.split("/");
		t.addPathParts(parts);
	});
	return t;
}

function askIfDeleteSetRequested(configs, callback) {
	var alreadyHasDeleteSet = false;
	var deleteSetIndex = -1;
	for (var i = 0; i < configs.length; i++) {
		var tuple = configs[i];
		if (tuple.length == 2) {
			if (tuple[1].delete_paths) {
				// We already have a delete_paths
				alreadyHasDeleteSet = true;
				deleteSetIndex = i;
				break;
			}
		}
	}
	var message = "Do you want to create a delete-set to remove affected files from the source repo?";
	if (alreadyHasDeleteSet) {
		message = "Update your current delete-set to reflect changes in your other configs?"
	}
	var property = {
	  name: 'yesno',
	  message: message,
	  validator: /y[es]?|n[o]?/,
	  warning: 'Must respond yes or no',
	  default: 'no'
	};
	prompt.get(property, function (err, result) {
		if (err){
			console.log("");
			exit(1);
		}
		if (result.yesno[0] == 'y') {
			var aSet = {};
			for (var i = 0; i < configs.length; i++) {
				var tuple = configs[i];
				if (tuple.length == 2) {
					for (var j = 0; j < tuple[1].files.length; j++) {
						var aPath = tuple[1].files[j];
						aSet[aPath] = true;
					}
				}
			}
			var allReferencedPaths = Object.keys(aSet).sort();
			var deleteSetPath = "delete-set.splitconfig.json";
			var deleteSet = splitconfig.splitConfigDeleteSetFactory();
			if (alreadyHasDeleteSet) {
				deleteSetPath = configs[deleteSetIndex][0];
				deleteSet = configs[deleteSetIndex][1];
			}
			deleteSet.delete_paths = allReferencedPaths;
			fs.writeFileSync(deleteSetPath,splitconfig.splitConfigToJSON(deleteSet));
			
			console.log("Delete-set written to delete-set.splitconfig.json");
			console.log("It's recommended that you review this file before applying it to your source repo!");
		}
		callback(configs);
	});
}

module.exports = {
	prepareAny: prepareAny,
	prepareSingle: prepareSingle,
};