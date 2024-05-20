#!/bin/bash

# Define the URL of the repository and the path to the ION file
REPO_URL="https://github.com/ION606/ION-Lang.git"

# Clone the repository
git clone "$REPO_URL"
# Change to the cloned repository directory
cd "ION-Lang" || exit

# Install npm dependencies
npm install

# Run the relink script
npm run relink

echo "to run a file, simply use \`ion {PATH_TO_ION_FILE}\`"