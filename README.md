# Pandora Term
A TUI interface for Pandora Radio

***Disclaimer: The creator of this program is not responsible for any things that may happen to your pandora account (eg. TOS violations i guess). There is no malicious code, you can read through it if you're sceptical***

## Prerequisites
* A Linux distro installed (Tested on Arch Linux)
    - WSL might work, but I didn't test it
* A copy of the program 
    ```sh
    git clone https://github.com/Cookey-Dev/pandora-term.git
    cd pandora-term
    ```
* X11 and xvfb

    Arch:
    ```sh
    sudo pacman -S xorg xvfb
    ```
    Debian/Ubuntu:
    ```sh
    # Didn't actually test this
    sudo apt install xorg xvfb
    ```
* Node.js
    - Install nvm (optional) ([Link](https://github.com/nvm-sh/nvm#installing-and-updating))
    - Install yarn ([Link](https://yarnpkg.com/getting-started/install))
    - Install deps
        ```sh
        yarn install
        ```
        This will install all required packages (~24MB)

### Logfile at /tmp/p-term.log