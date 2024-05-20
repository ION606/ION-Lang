#!/bin/bash

# Clone the repository
git clone "https://github.com/ION606/ION-Lang.git"
# Change to the cloned repository directory
cd "ION-Lang" || exit

# Install npm dependencies
npm install

# Run the relink script
npm run relink

echo "to run a file, simply use \`ion {PATH_TO_ION_FILE}\`"