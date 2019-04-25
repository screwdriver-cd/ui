FROM nginx:1.14.2-alpine
COPY nginx.conf /etc/nginx/nginx.conf
WORKDIR /usr/share/nginx/html
RUN set -x \
   # Missing https for some magic reason
   && apk add --no-cache --update ca-certificates \
   && apk add --virtual .build-dependencies wget \
   && apk add nginx-mod-http-lua \
   && wget -q -O - https://github.com/screwdriver-cd/ui/releases/latest \
       | egrep -o '/screwdriver-cd/ui/releases/download/v[0-9.]*/sdui.tgz' \
       | wget --base=http://github.com/ -i - -O sdui.tgz \
   && tar -xvzf sdui.tgz \
   && rm -rf sdui.tgz \
   # Cleanup packages
   && apk del --purge .build-dependencies
