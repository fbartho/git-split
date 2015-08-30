#!/usr/bin/env node

// This file serves as the main entry point of a commandline tool for splitting git repos

var git = require("nodegit");
var path = require("path");
var parser = require("nomnom");
var apply = require("../lib/apply.js");
var prepare = require("../lib/prepare.js");

require("shelljs/global");
if (!which("git")) {
	echo("Sorry, this script requires git");
	exit(1);
}

(function main() {
	parser.script("git-split")
	parser.command("prepare")
		.option("configs", {
			abbr:"c",
			list: true,
//			position:0,
//			required:false,
			default:ls("*.splitconfig.json"),
			help: "Split-config file path(s) to edit or create. (If none, will help you create some)"
		})
		.option("newconfigs", {
			abbr:"n",
			flag:true,
			help: "Force-create new Split-configs."
		})
		.option("sourcerepo", {
			abbr:"s",
			default:process.cwd(),
			required:false,
			help:"Source repository to split from."
		})
		.option("makedelete", {
			flag:true,
			default:false,
			help:"Make a delete commit for the files referenced in the passed in configs"
		})
		.callback(prepare.prepareAny)
		.help("Interactive Git Repository Split Builder -- This command helps you adjust an existing splitconfig file, or helps you create your initial splitconfig files.");
	
	parser.command("apply")
		.option("configs", {
			abbr:"c",
			list: true,
//			position:0,
//			required:false,
			default:ls("*.splitconfig.json"),
			help: "Split-config file path(s) to read & apply to the source"
		})
		.option("sourcerepo", {
			abbr:"s",
			default:process.cwd(),
			required:false,
			help:"Source repository to split from."
		})
		.callback(apply.applyAny)
		.help("Apply the git-split configuration files to produce new repositories preserving the history of the files specified therein.")
	
	parser.command("installalias")
		.callback(function(){
			// We need to use git config followed by sed, because bash & git config aren't friends with bang characters
			exec('git config --global --add alias.split GITSPLITSENTINEL')
			var home = (process.env.HOME || process.env.HOMEPATH || process.env.HOMEDIR || process.cwd());
			sed("-i","GITSPLITSENTINEL","!git-split",path.join(home,".gitconfig"))
			
			console.log("git-split is now installed as `git split` 🍻!")
		})
		.help("Install a git alias globally so git-split can be called as `git split`")
		
	parser.parse();
})();
