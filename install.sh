# Postinstall script

END="\033[0m"
RED="\033[91m"
GREEN="\033[92m"
YELLOW="\033[93m"
BLUE="\033[94m"

notice() {
    printf "\n${YELLOW}ERROR: $* not found, install it!\n$END"
    exit 1
}
installing() {
    printf "${BLUE}$* version: "
}
e() { # End color
    printf "$END"
}

installing "Python 3"
python3 --version || notice "Python 3"
e

pip install pypresence || exit 1

installing "Node.js"
node -v || notice "Node.js"
installing "XVFB"
command -v xvfb-run || notice "XVFB"
installing "Yarn"
yarn -v || notice "Yarn"
e

yarn install || exit 1

printf "$BLUE###################################\n#   Postinstall script finished   #\n# DO NOT ignore any notices above #\n###################################$END\n"
