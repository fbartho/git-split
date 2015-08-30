Docs for SplitConfig files.
==========================

### Basic foo.splitconfig.json structure

	{
		"target_path":"full/path/to/target/repo",
		"author_behavior": preserve, // value from [preserve, overwrite]
		"committer_behavior": preserve, // value from [preserve, overwrite]
		"collision_strategies": {
			default:{
				file: "abort",// value from [abort, erase_target_first, single_commit]
				// if a file collides with an existing file in the target repo, what should we do?
				// - abort: print message & abort
				// - erase_target_first: erases the target file with a special commit before installing the new one.
				// - "single_commit": drop the history, but take the final file state, and create a single commit for it moving it from current state to the final state.
				
				branch: "prefix", // value from [prefix, abort, unsafe_ignore]
				// What should we do if a needed branch already exists in the target repo?
				// - prefix: proceed anyhow, by appending a prefix to the branch name.
				// - abort: print message & abort
				// - unsafe_ignore: proceed anyhow, only use this if you're sure the file won't collide!
				branch_prefix:"git-split/",
			
				branch_cleanup:true, // Should we auto-delete any branches created due to git-split?
			},
			branch_specific:{
				// see collision_strategies.default.branch* for fields that can go in here.
				"master":{
					branch: "unsafe_ignore",// The master branch is special, and very likely to exist
				}
			}
			file_specific:{
				//Overrides for a specific path, see collision_strategies.default.file
				"full/path": "abort"
			},
		},
		"files":[ // This is the list of actual files to trace
			"full/file/path"
		]
	}

### Special case: deleteset.splitconfig.json

`$ git-split prepare` will ask if you want to delete the files referenced in the new splitconfigs from the original source repo, if yes, this is the structure:
	{
		delete_paths:[
			"full/file/path"
		]
	}
These paths will be the union of all the splitconfigs considered when preparing the deleteset. You should feel free to edit this file to remove any paths you want to copy rather than remove from the source repo. They will simply all be passed to git rm, and the results staged and committed. (You can amend this commit if you want to change the message or contents.)