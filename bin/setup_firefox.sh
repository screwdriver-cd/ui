#!/bin/sh
cd /tmp
wget https://download-installer.cdn.mozilla.net/pub/firefox/releases/55.0/linux-x86_64/en-US/firefox-55.0.tar.bz2
tar xvf firefox-55.0.tar.bz2
ln -s /tmp/firefox/firefox /usr/bin/firefox
