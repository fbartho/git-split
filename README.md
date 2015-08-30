git-split
=========

### Todo / Status

- [X] Structure, Planning, and GitHub Repo
- [x] Prepare Interactive Script
- [ ] Apply Interactive Script
	- [ ] Can split simple repos (no merges).
	- [ ] Can split simple merges (no conflicts).
	- [ ] Can split conflicted merges (no branch collisions, no file collisions).
	- [ ] Can split with branch problems
		- [ ] necessary branches already exist in target repo.
	- [ ] Can split with file collisions
		- [ ] file already exists at destination - delete-first, then do branch manipulations
		- [ ] file already exists at destination - overwrite (with final data)
- [ ] Publish to NPM
- ? UnitTests

# WARNING: this is WIP

# Purpose

Git Split is an interactive utility that helps you split a repository into two or more repositories, while preserving the commit history as much as possible.

If you've ever started a project out as a single repo, but later wanted to extract some of those files to distribute separately, this tool is for you.

# Features

- `git-split prepare` is an interactive utility to help you build a description of which files you want to extract, and how to deal with collisions in the target repo.
- `git-split apply` will take the provided config files, and run them on your source repos and produce the new repositories with just the history you want to preserve.
- Optional: Integrates an alias into your git config so you can use it as `git split`
- Optional: Creates a commit deleting these files from your original source repository.

# Documentation

1. Documentation for the `.splitconfig.json` file format can be found under [docs](../docs/splitconfig.json.md).
2. Examples can be found [here](../example/).
3. Documentation on commands and flags can be viewed on the commandline by passing `-h` or `--help`. 

	$ git split --help

	Usage: git-split <command>

	command     
	  prepare          Interactive Git Repository Split Builder -- This command helps you adjust an existing splitconfig file, or helps you create your initial splitconfig files.
	  apply            Apply the git-split configuration files to produce new repositories preserving the history of the files specified therein.
	  installalias     Install a git alias globally so git-split can be called as `git split`

	$ git split prepare -h

### Prepare

	$ git split prepare --help

	Usage: git-split prepare [options]

	Options:
	   -c, --configs      Split-config file path(s) to edit or create. (If none, will help you create some)  [`*.splitconfig.json`]
	   -n, --newconfigs   Force-create new Split-configs.
	   -s, --sourcerepo   Source repository to split from.  [`pwd`]
	   --makedelete       Make a delete commit for the files referenced in the passed in configs  [false]

	Interactive Git Repository Split Builder -- This command helps you adjust an existing splitconfig file, or helps you create your initial splitconfig files.

### Apply

	$ git split apply --help

	Usage: git-split apply [options]

	Options:
	   -c, --configs      Split-config file path(s) to read & apply to the source  [`*.splitconfig.json`]
	   -s, --sourcerepo   Source repository to split from.  [`pwd`]

	Apply the git-split configuration files to produce new repositories preserving the history of the files specified therein.

### Install Alias

	$ git split installalias --help

	Usage: git-split installalias
	Install a git alias globally so git-split can be called as `git split`

## Installation

	npm install --global git-split

or

	git clone github.com/fbartho/git-split; cd git-split; npm link

To install the global git alias and using this utility as `git split`, either run:
	
	$ git-split installalias

Or add the following to your `~/.gitconfig`

	[alias]
		split = !git-split
