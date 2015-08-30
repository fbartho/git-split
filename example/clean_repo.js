// This blows away and recreates a clean source directory and allocates a git repo while making appropriate edits.

require("shelljs/global");
if (!which("git")) {
	echo("Sorry, this script requires git");
	exit(1);
}

// This uses shell commands to manipulate git, so that we know it's not dependent on any bugs or behavior from git-split itself.
function clean_output_directory() {
	pushd(__dirname);
	console.log(ls("*"));
	rm("-rf","output");
	mkdir("-p","output/source_repo");
	cd("output");
	cd("source_repo");
	
	exec("git init");
	"Demo Source Repo for git-split".to("README.md");
	ac("README.md","Initial commit");
	
	// Two single line commits on one file
	"A.line 1\n".toEnd("a");
	ac("a","a");
	"A.line 2\n".toEnd("a");
	ac("a","a2");
	
	// One single line commit on new file
	"B.line 1\n".toEnd("b");
	ac("b","b");
	
	// One more line commit on first file
	"A.line 3\n".toEnd("a");
	ac("a","a again");
	
	// Two files at once
	"A.line 4\n".toEnd("a");
	"B.line 2\n".toEnd("b");
	gac(["a","b"],"a, b together");
	
	// Third file
	"C.line 1\n".toEnd("c");
	ac("c","c");
	
	// Three files together
	"A.line 5\n".toEnd("a");
	"B.line 3\n".toEnd("b");
	"C.line 2\n".toEnd("c");
	gac(["a","b","c"],"a, b, c together");
	
	// Create branch
	cob("branch2");
	// Fourth file
	"D.line 1\n".toEnd("d");
	ac("d","d");
	
	// Make branches diverge
	co("master");
	"C.line 3\n".toEnd("c");
	ac("c","c3");
	
	co("branch2");
	"D.line 2\n".toEnd("d");
	ac("d","d2");
	
	// No conflict commit & merge
	"D.line 3\n".toEnd("d");
	"B.line 4\n".toEnd("b");
	gac(["d","b"],"b, d together");
	co("master");
	mergeNoConflict("branch2","No-conflict merge");
	
	exec("git x");
	
	popd();
}
function createTmpRepos() {
	mkdir("t1","t2");
	pushd("t1");
	exec("git init");
	"Target1 Repo for git-split".to("README.md");
	ac("README.md","Initial commit");
	cd("../t2");
	exec("git init");
	"Target2 Repo for git-split".to("README.md");
	ac("README.md","Initial commit");
	popd();
}

function addAndCommit(path, message) {
	if(exec('git add "'+path+'"; git commit -m "'+message+'"').code != 0) {
		echo("Error Committing!");
		exit(1);
	}
}
function groupAddAndCommit(paths, message) {
	paths.forEach(function(p){
		if(exec('git add "'+p+'"').code != 0) {
			echo("Error Adding!");
			exit(1);
		}
	});
	if(exec('git commit -m "'+message+'"').code != 0) {
		echo("Error Committing!");
		exit(1);
	}
}
function checkoutBranch(branch) {
	if(exec('git checkout "'+branch+'"').code != 0) {
		echo("Error checking out!");
		exit(1);
	}
}
function createAndCheckoutBranch(branch) {
	if(exec('git checkout -b "'+branch+'"').code != 0) {
		echo("Error creating / checking out!");
		exit(1);
	}
}
function mergeNoConflict(fromBranch) {
	if(exec('git merge "'+fromBranch+'"').code != 0) {
		echo("Error Merging!");
		exit(1);
	}
}
function mergeWithConflict(fromBranch,message,conflictResolver) {
	if(exec('git merge "'+fromBranch+'"').code != 0) {
		echo("Error Merging!");
		exit(1);
	}
	conflictResolver();
	if(exec('git commit -m "'+message+'"').code != 0) {
		echo("Error Merging!");
		exit(1);
	}
}
var ac = addAndCommit;
var gac = groupAddAndCommit;
var co = checkoutBranch;
var cob = createAndCheckoutBranch;

module.exports = {
	cleanSource:clean_output_directory,
	createTmpRepos:createTmpRepos,
};

if (!module.parent) {
	clean_output_directory();
}