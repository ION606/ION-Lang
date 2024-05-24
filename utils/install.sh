#!/bin/bash

# Clone the repository
git clone "https://github.com/ION606/ION-Lang.git" ~
# Change to the cloned repository directory
cd "ION-Lang" || exit

# Install npm dependencies
npm install

# Run the relink script
npm run relink

# echo "alias ion='~/ION-Lang'" >> ./~bashrc

echo "to run a file use \`ion run {PATH_TO_ION_FILE}\`"
echo "to install a package use \`ion install {PATH_TO_ION_FILE}\` or \`ion i {PATH_TO_ION_FILE}\`"