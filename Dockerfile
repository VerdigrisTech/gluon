FROM node:8.11-alpine

ARG VERSION
RUN npm install -g @verdigris/gluon@$VERSION
CMD [ "gluon" ]
