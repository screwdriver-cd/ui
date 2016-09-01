FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /usr/share/nginx/html
RUN set -x \
   # Missing https for some magic reason
   && apk add --no-cache --update ca-certificates \
   && apk add --virtual .build-dependencies wget \
   && wget $(wget -q -O - https://api.github.com/repos/screwdriver-cd/ui/releases/latest \
       | awk '/browser_download_url/ { print $2 }' \
       | sed 's/"//g') \
   && tar -xvzf sdui.tgz \
   && rm -rf sdui.tgz \
   # Cleanup packages
   && apk del --purge .build-dependencies
