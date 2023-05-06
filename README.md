# Pandora Term
A TUI interface for Pandora (the music streaming service)

*This program is built with Pandora Premium in mind, but later will get tested for Pandora free plan support. Pandora plus will never be supported because I don't have access to it (unless it shares some selectors).*

***Disclaimer: The creator of this program is not responsible for any things that may happen to your pandora account (eg. TOS violations i guess). There is no malicious code, you can read through it if you're sceptical***

## Prerequisites
* A Linux distro installed (Tested on Arch Linux)
    - WSL might work, but I didn't test it
* A copy of the program 
    ```sh
    git clone https://github.com/Cookey-Dev/pandora-term.git
    cd pandora-term
    ```
* X11, xvfb, and libsixel

    Arch:
    ```sh
    sudo pacman -S xorg xvfb libsixel
    ```
    Debian/Ubuntu:
    ```sh
    # Didn't actually test this
    sudo apt install xorg xvfb img2sixel x11-utils
    ```
* Node.js
    - Install nvm (optional) ([Link](https://github.com/nvm-sh/nvm#installing-and-updating))
    - Install yarn ([Link](https://yarnpkg.com/getting-started/install))
* A terminal emulator

    The terminal emulator must support **truecolor**, **sixel**, and **unicode/emojis**.
    Examples include: [UXTerm](https://invisible-island.net/xterm/), [Alacritty-sixel](https://github.com/microo8/alacritty-sixel) (which I use), and others (which you can find at [arewesixelyet](https://www.arewesixelyet.com/).)
## Run the install check
Run in pandora-term folder
```sh
sh install.sh
```

## Related projects
* [Spotify-TUI](https://github.com/Rigellute/spotify-tui)

### Logfile at /tmp/p-term.log
