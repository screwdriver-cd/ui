FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY sdui.tgz /usr/share/nginx/html/
WORKDIR /usr/share/nginx/html
RUN set -x \
   # Missing https for some magic reason
   && apk add --no-cache --update ca-certificates \
   && apk add --virtual .build-dependencies wget \
   && apk add nginx-lua \
   && tar -xvzf sdui.tgz \
   && rm -rf sdui.tgz \
   # Cleanup packages
   && apk del --purge .build-dependencies
