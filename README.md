git-split
=========

# Purpose

Git Split is an interactive utility that helps you split a repository into two or more repositories, while preserving the commit history as much as possible.

If you've ever started a project out as a single repo, but later wanted to extract some of those files to distribute separately, this tool is for you.

# Features

- `git-split prepare` is an interactive utility to help you build a description of which files you want to extract, and how to deal with collisions in the target repo.
- `git-split apply` will take the provided config files, and run them on your source repos and produce the new repositories with just the history you want to preserve.
- Optional: Integrates an alias into your git config so you can use it as `git split`
- Optional: Creates a commit deleting these files from your original source repository.

# Documentation

Documentation on commands and flags can be viewed on the commandline by passing `-h` or `--help`. Documentation for the `.splitconfig.json` file format can be found under [docs](../docs/splitconfig.json.md).
Examples can be found [here](../example/).

### Installation

	npm install --global git-split

or

	git clone github.com/fbartho/git-split; cd git-split; npm link

To install the global git alias and using this utility as `git split`, either add the following to your `~/.gitconfig`

	[alias]
		split = !git-split
