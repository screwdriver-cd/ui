#!/bin/bash

# Constants
TAGS=$(git tag -l --sort="version:refname")
INDEX=${#TAGS}
let "INDEX--"
VERSION=0
MAJOR=0
MINOR=0
PATCH=0

# Functions
function findNextPeriod() {
	while [[ ${VERSION:$INDEX:1} != "." ]]
	do
		let "INDEX++"
	done
}

# Find the highest version tag
while [[ ${TAGS:$INDEX:1} != "v" ]]
do
	let "INDEX--"
done
VERSION=${TAGS:$INDEX+1}

# Find the Major number
INDEX=0
findNextPeriod
MAJOR=${VERSION:0:$INDEX}

# Find the Minor number
VERSION=${VERSION:$INDEX+1}
findNextPeriod
MINOR=${VERSION:0:$INDEX}

# Find the Patch number and increment
VERSION=${VERSION:$INDEX+1}
PATCH=$VERSION
let "PATCH++"

# Return the incremented version
VERSION=v$MAJOR.$MINOR.$PATCH
echo $VERSION
