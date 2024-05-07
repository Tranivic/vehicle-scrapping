    apt-get update \
        && apt-get install -y wget gnupg \
        && apt-get -y install sudo \
        && adduser --disabled-password --gecos '' docker \
        && adduser docker sudo \
        && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
        && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
        && apt-get update \
        && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 \
        && service dbus start \
        && rm -rf /var/lib/apt/lists/* \
        && npm run dockerInstall \
        && groupadd -r pptruser && useradd -rm -g pptruser -G audio,video pptruser \
        && su - pptruser -c 'whoami; id; echo $SHELL;' && npm run start