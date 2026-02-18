apt update

# Doppler
# https://docs.doppler.com/docs/install-cli#installation

# Install Doppler requirements
apt install -y gnupg

# Install Doppler CLI
(curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh || wget -t 3 -qO- https://cli.doppler.com/install.sh) | sudo sh
