#!/bin/bash

# Helper function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "Starting install for OS: \"$(uname -s)\""

if [ -d "MAC" ]; then
    cd "MAC"
fi

# Check if Node.js is installed
if ! command_exists node; then
    echo "Node.js is not installed. Installing..."
    
    # Check if we're running on Windows
    if [[ "$(uname -s)" == "Linux" || "$(uname -s)" == "Darwin" ]]; then
        # Install Node.js and npm using a package manager
        if [[ "$(uname -s)" == "Linux" ]]; then
            sudo apt-get update || sudo dnf update
            sudo apt-get install -y nodejs npm || sudo dnf install nodejs npm

        elif [[ "$(uname -s)" == "Darwin" ]]; then
            if ! command_exists brew; then
                echo "Please Install Brew by pasting the following into a terminal then re-running this:"
                echo "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                echo "echo 'eval \"$(/opt/homebrew/bin/brew shellenv)\"' >> ~/.zprofile eval \"$(/opt/homebrew/bin/brew shellenv)\""
                exit 1;

                # echo "Installing Brew"
                # echo "" | /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            # For macOS using Homebrew
            brew install node
        fi
    else
        # We're running on Windows with WSL
        # Install Node.js and npm using the Linux package manager
        sudo apt-get update
        sudo apt-get install -y nodejs npm
    fi
fi


# Check if npm is installed (some systems install it separately)
if ! command_exists npm; then
    echo "npm is not installed. Installing..."
    
    # Check if we're running on Windows
    if [[ "$(uname -s)" == "Linux" || "$(uname -s)" == "Darwin" ]]; then
        # Install npm using a package manager
        if [[ "$(uname -s)" == "Linux" ]]; then
            # For Linux
            sudo apt-get update || sudo dnf update
            sudo apt-get install -y npm || sudo dnf install npm

            elif [[ "$(uname -s)" == "Darwin" ]]; then
            # For macOS using Homebrew
            brew install npm
        fi
    else
        # We're running on Windows with WSL
        # Install npm using the Linux package manager
        sudo apt-get install -y npm
    fi
fi

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