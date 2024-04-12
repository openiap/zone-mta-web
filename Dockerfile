FROM node:lts-alpine3.15 as builder

RUN mkdir /app
WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY . /app/

RUN npm run build --omit=dev

FROM nginx:stable-alpine

RUN apk add --no-cache bash

# add init script
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist/ .

COPY ./docker/entrypoint.sh /app/entrypoint.sh
COPY ./.env.production .env.production

# expose internal port:80 and run init.sh
EXPOSE 80

ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# docker build -t cloudhack/vue3-template . && docker push cloudhack/vue3-template
# docker push cloudhack/vue3-template

