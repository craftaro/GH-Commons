# songoda/GitHub-Commons
This repository is a collection of files commonly used in out projects – It is not for snippets
that only one or two projects might use!


## Setting up a new project
If you are starting a project from scratch,
please copy the files from this repository and configure/check all of them.

Please use your IDE to search across all files for `TODO` and `FIXME`.
Use these to configure parts of the project or delete the file if it is not needed.

---

# GitHub Actions
We are now using GitHub Actions to automate our CI/CD pipelines (most projects are still running on our TeamCity instance tho).


## Workflow Templates
There are templates available at [.github/workflow/](.github/workflow).
Check all the `TODO` and `FIXME` comments in them to set it up properly.


## Actions
A lot of common functionality has been grouped into own little actions at [.github/actions/](.github/actions)
to easily be used in other projects with little duplication.

The syntax for using them is basically `- uses: songoda/GH-Commons/.github/actions/ACTION_NAME@master` –
For more information, see [GitHub Actions](https://help.github.com/en/actions).

Example usages can be found inside [.github/workflow/](.github/workflow).

- - -

## Miscellaneous

## `.github/dependabot.yml`
We use dependabot right now to remind us about dependency updates.

You might need to add/remove sections to the configuration if you are not using Maven.


## `.gitignore`
Just a normal `.gitignore` file with some common patterns.

* Use absolute paths where possible when adding new stuff to it
* Use `/` as a path separator when adding new stuff to it
* Put an `/` at the end if you are excluding a directory

So for example, use `/target/` **and** `/NMS/**/target/`
instead of excluding all directories named `target` or even all files named `target` because there is no `/` at the end.


## `.editorconfig`
A lot of IDEs support this file format to automatically apply some basic file formatting.

**TODO: We have yet to decide on a tool and style we want to use for Java Code.**


## `.github/FUNDING.yml`
You have to enable this feature in the repository settings
([GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository#displaying-a-sponsor-button-in-your-repository)).
